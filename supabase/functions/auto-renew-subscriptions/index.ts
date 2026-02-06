import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const YOOKASSA_SHOP_ID = Deno.env.get("YOOKASSA_SHOP_ID");
const YOOKASSA_SECRET_KEY = Deno.env.get("YOOKASSA_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface Subscription {
  user_id: string;
  purchase_price: number;
  expires_at: string;
  profiles: {
    yookassa_payment_method_id: string;
  };
}

serve(async (req) => {
  try {
    // Проверка авторизации (simple secret)
    const authHeader = req.headers.get("authorization");
    const cronSecret = Deno.env.get("CRON_SECRET") || "auto-renew-secret";

    if (authHeader !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!YOOKASSA_SHOP_ID || !YOOKASSA_SECRET_KEY) {
      return new Response(JSON.stringify({ error: "YooKassa not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    const today = new Date().toISOString().split("T")[0];

    console.log(`[Auto-renew] Starting for date: ${today}`);

    // Находим все Pro подписки, которые истекают сегодня
    const { data: expiringSubscriptions, error } = await supabase
      .from("user_subscriptions")
      .select(`
        user_id,
        purchase_price,
        expires_at,
        profiles!inner(
          yookassa_payment_method_id
        )
      `)
      .eq("plan", "pro")
      .eq("status", "active")
      .gte("expires_at", `${today}T00:00:00Z`)
      .lt("expires_at", `${today}T23:59:59Z`);

    if (error) {
      console.error("[Auto-renew] Database error:", error);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!expiringSubscriptions || expiringSubscriptions.length === 0) {
      console.log("[Auto-renew] No expiring subscriptions found");
      return new Response(JSON.stringify({
        success: true,
        processed: 0,
        message: "No expiring subscriptions"
      }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`[Auto-renew] Found ${expiringSubscriptions.length} expiring subscriptions`);

    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    const results: Array<{ user_id: string; success: boolean; error?: string }> = [];

    // Обрабатываем каждую подписку
    for (const sub of expiringSubscriptions as unknown as Subscription[]) {
      processed++;
      const userId = sub.user_id;
      const paymentMethodId = sub.profiles?.yookassa_payment_method_id;
      const purchasePrice = sub.purchase_price || 499;

      console.log(`[Auto-renew] Processing user: ${userId}, payment_method: ${paymentMethodId}, price: ${purchasePrice}`);

      // Пропускаем если нет сохранённого платёжного метода
      if (!paymentMethodId) {
        console.log(`[Auto-renew] Skipping ${userId} - no saved payment method`);
        failed++;
        results.push({ user_id: userId, success: false, error: "No payment method" });
        continue;
      }

      try {
        // Создаём платёж в YooKassa с сохранённым payment_method
        const idempotenceKey = `auto-renew-${userId}-${Date.now()}`;
        const authHeader = "Basic " + btoa(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`);

        const paymentResponse = await fetch("https://api.yookassa.ru/v3/payments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotence-Key": idempotenceKey,
            "Authorization": authHeader,
          },
          body: JSON.stringify({
            amount: {
              value: `${purchasePrice}.00`,
              currency: "RUB"
            },
            capture: true,
            payment_method_id: paymentMethodId,
            description: `Job AI Search — Автопродление Pro подписки`,
            metadata: {
              user_id: userId,
              type: "subscription",
              auto_renewal: true,
            },
          }),
        });

        if (!paymentResponse.ok) {
          const errorText = await paymentResponse.text();
          console.error(`[Auto-renew] YooKassa error for ${userId}:`, errorText);
          failed++;
          results.push({ user_id: userId, success: false, error: "YooKassa error" });
          continue;
        }

        const payment = await paymentResponse.json();

        // Сохраняем информацию о платеже
        await supabase.from("payment_history").insert({
          user_id: userId,
          yookassa_payment_id: payment.id,
          yookassa_status: payment.status,
          amount: purchasePrice,
          currency: "RUB",
          type: "subscription",
          status: payment.status === "succeeded" ? "succeeded" : "pending",
          metadata: {
            description: "Автопродление подписки",
            created_at: new Date().toISOString(),
            auto_renewal: true,
          },
        });

        if (payment.status === "succeeded") {
          // Продлеваем подписку
          const expiresAt = new Date();
          expiresAt.setMonth(expiresAt.getMonth() + 1);

          await supabase
            .from("user_subscriptions")
            .update({
              expires_at: expiresAt.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

          console.log(`[Auto-renew] SUCCESS for user: ${userId}`);
          succeeded++;
          results.push({ user_id: userId, success: true });
        } else if (payment.status === "pending") {
          // Ожидаем подтверждения (webhook обработает позже)
          console.log(`[Auto-renew] PENDING for user: ${userId}`);
          succeeded++;
          results.push({ user_id: userId, success: true });
        } else {
          console.error(`[Auto-renew] FAILED for user: ${userId}, status: ${payment.status}`);
          failed++;
          results.push({ user_id: userId, success: false, error: `Payment ${payment.status}` });
        }
      } catch (err) {
        console.error(`[Auto-renew] Exception for user ${userId}:`, err);
        failed++;
        results.push({ user_id: userId, success: false, error: "Exception" });
      }
    }

    console.log(`[Auto-renew] Completed: processed=${processed}, succeeded=${succeeded}, failed=${failed}`);

    return new Response(JSON.stringify({
      success: true,
      processed,
      succeeded,
      failed,
      results,
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[Auto-renew] Exception:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID;
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY;

// API endpoint для автоматического продления подписки
// Создаёт платёж в YooKassa используя сохранённый payment_method_id и purchase_price
export async function POST(request: NextRequest) {
  try {
    // Проверка авторизации (secret key для защиты от несанкционированного доступа)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "auto-renew-secret";

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error("[Auto-renew] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!YOOKASSA_SHOP_ID || !YOOKASSA_SECRET_KEY) {
      console.error("[Auto-renew] YooKassa not configured");
      return NextResponse.json(
        { error: "Payment system not configured" },
        { status: 500 }
      );
    }

    const supabase = getSupabaseAdmin();
    const today = new Date().toISOString().split("T")[0];

    console.log(`[Auto-renew] Starting for date: ${today}`);

    // Находим все Pro подписки, которые истекают сегодня
    const { data: expiringSubscriptions, error: fetchError } = await supabase
      .from("user_subscriptions")
      .select(`
        user_id,
        purchase_price,
        profiles!inner(
          email,
          yookassa_payment_method_id
        )
      `)
      .eq("plan", "pro")
      .eq("status", "active")
      .gte("expires_at", `${today}T00:00:00Z`)
      .lt("expires_at", `${today}T23:59:59Z`);

    if (fetchError) {
      console.error("[Auto-renew] Fetch error:", fetchError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!expiringSubscriptions || expiringSubscriptions.length === 0) {
      console.log("[Auto-renew] No expiring subscriptions found");
      return NextResponse.json({
        success: true,
        processed: 0,
        message: "No expiring subscriptions"
      });
    }

    console.log(`[Auto-renew] Found ${expiringSubscriptions.length} expiring subscriptions`);

    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    const results: Array<{ user_id: string; success: boolean; error?: string }> = [];

    // Обрабатываем каждую подписку
    for (const sub of expiringSubscriptions) {
      processed++;
      const userId = sub.user_id;
      const paymentMethodId = sub.profiles?.yookassa_payment_method_id;
      const purchasePrice = sub.purchase_price || 499; // Фоллбэк на дефолтную цену
      const email = sub.profiles?.email;

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
        const paymentResponse = await fetch("https://api.yookassa.ru/v3/payments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotence-Key": idempotenceKey,
            "Authorization": `Basic ${Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString("base64")}`,
          },
          body: JSON.stringify({
            amount: {
              value: `${purchasePrice}.00`,
              currency: "RUB"
            },
            capture: true, // Сразу списываем деньги
            payment_method_id: paymentMethodId, // Используем сохранённый метод
            description: `Job AI Search — Автопродление Pro подписки на 1 месяц`,
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
          // Ожидаем подтверждения (может потребовать 3DS)
          console.log(`[Auto-renew] PENDING for user: ${userId} - waiting for confirmation`);
          // Webhook обработает успешный платёж позже
          succeeded++;
          results.push({ user_id: userId, success: true });
        } else {
          // Платёж отклонён или не прошёл
          console.error(`[Auto-renew] FAILED for user: ${userId}, status: ${payment.status}`);
          failed++;
          results.push({ user_id: userId, success: false, error: `Payment ${payment.status}` });

          // Отправляем уведомление пользователю (можно добавить email later)
        }
      } catch (err) {
        console.error(`[Auto-renew] Exception for user ${userId}:`, err);
        failed++;
        results.push({ user_id: userId, success: false, error: "Exception" });
      }
    }

    console.log(`[Auto-renew] Completed: processed=${processed}, succeeded=${succeeded}, failed=${failed}`);

    return NextResponse.json({
      success: true,
      processed,
      succeeded,
      failed,
      results,
    });
  } catch (e) {
    console.error("[Auto-renew] Exception:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET для проверки статуса
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Auto-renew endpoint",
    timestamp: new Date().toISOString(),
  });
}

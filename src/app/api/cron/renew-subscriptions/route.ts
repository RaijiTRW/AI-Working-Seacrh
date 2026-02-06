import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const CRON_SECRET = process.env.CRON_SECRET || "auto-renew-secret";

// Публичный endpoint для cron задач на VDS
// Вызывается: curl -X POST "https://jobaisearch.ru/api/cron/renew-subscriptions?secret=YOUR_SECRET"
export async function POST(request: NextRequest) {
  try {
    // Проверяем секрет из query параметра
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    if (secret !== CRON_SECRET) {
      console.error("[Cron] Invalid secret attempt");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.log("[Cron] Starting subscription auto-renew...");

    const supabase = getSupabaseAdmin();
    const today = new Date().toISOString().split("T")[0];

    // Находим все Pro подписки, которые истекают сегодня
    const { data: expiringSubscriptions } = await supabase
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

    if (!expiringSubscriptions || expiringSubscriptions.length === 0) {
      console.log("[Cron] No expiring subscriptions found");
      return NextResponse.json({
        success: true,
        processed: 0,
        message: "No expiring subscriptions"
      });
    }

    console.log(`[Cron] Found ${expiringSubscriptions.length} expiring subscriptions`);

    // Импортируем функцию автопродления
    const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID;
    const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY;

    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    for (const sub of expiringSubscriptions) {
      processed++;
      const userId = sub.user_id;
      const paymentMethodId = sub.profiles?.yookassa_payment_method_id;
      const purchasePrice = sub.purchase_price || 499;

      if (!paymentMethodId) {
        console.log(`[Cron] Skipping ${userId} - no saved payment method`);
        failed++;
        continue;
      }

      try {
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
          console.error(`[Cron] YooKassa error for ${userId}`);
          failed++;
          continue;
        }

        const payment = await paymentResponse.json();

        // Сохраняем платеж в историю
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
            auto_renewal: true,
          },
        });

        if (payment.status === "succeeded" || payment.status === "pending") {
          // При успехе продлеваем подписку
          const expiresAt = new Date();
          expiresAt.setMonth(expiresAt.getMonth() + 1);

          await supabase
            .from("user_subscriptions")
            .update({
              expires_at: expiresAt.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

          console.log(`[Cron] SUCCESS for user: ${userId}`);
          succeeded++;
        } else {
          console.error(`[Cron] FAILED for user: ${userId}, status: ${payment.status}`);
          failed++;
        }
      } catch (err) {
        console.error(`[Cron] Exception for user ${userId}:`, err);
        failed++;
      }
    }

    console.log(`[Cron] Completed: processed=${processed}, succeeded=${succeeded}, failed=${failed}`);

    return NextResponse.json({
      success: true,
      processed,
      succeeded,
      failed,
    });
  } catch (e) {
    console.error("[Cron] Exception:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET для проверки
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    status: "ok",
    message: "Cron endpoint working",
    timestamp: new Date().toISOString(),
  });
}

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID;
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY;

// YooKassa webhook для уведомлений о платежах
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("[Webhook] Received:", JSON.stringify(body, null, 2));

    // Проверяем тип события
    if (body.event !== "payment.succeeded" && body.event !== "payment.canceled") {
      console.log("[Webhook] Ignoring event:", body.event);
      return NextResponse.json({ status: "ignored" });
    }

    const payment = body.object;
    if (!payment?.id) {
      console.error("[Webhook] No payment ID in webhook");
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Верифицируем платеж через API YooKassa
    if (YOOKASSA_SHOP_ID && YOOKASSA_SECRET_KEY) {
      const verifyResponse = await fetch(
        `https://api.yookassa.ru/v3/payments/${payment.id}`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString("base64")}`,
          },
        }
      );

      if (!verifyResponse.ok) {
        console.error("[Webhook] Failed to verify payment");
        return NextResponse.json({ error: "Verification failed" }, { status: 400 });
      }

      const verifiedPayment = await verifyResponse.json();
      if (verifiedPayment.status !== payment.status) {
        console.error("[Webhook] Status mismatch");
        return NextResponse.json({ error: "Status mismatch" }, { status: 400 });
      }
    }

    const supabase = getSupabaseAdmin();
    const userId = payment.metadata?.user_id;
    const paymentType = payment.metadata?.type;

    if (!userId) {
      console.error("[Webhook] No user_id in metadata");
      return NextResponse.json({ error: "No user_id" }, { status: 400 });
    }

    if (body.event === "payment.succeeded") {
      console.log("[Webhook] Processing successful payment for user:", userId);

      // Обновляем статус платежа
      await supabase
        .from("payment_history")
        .update({
          status: "succeeded",
          yookassa_status: payment.status,
        })
        .eq("yookassa_payment_id", payment.id);

      // Обрабатываем по типу платежа
      if (paymentType === "subscription") {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        // Обновляем подписку
        await supabase
          .from("user_subscriptions")
          .upsert({
            user_id: userId,
            plan: "pro",
            status: "active",
            can_search_online: true,
            started_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            yookassa_payment_id: payment.id,
          }, {
            onConflict: "user_id",
          });

        // Обновляем лимиты
        await supabase
          .from("user_request_limits")
          .upsert({
            user_id: userId,
            daily_limit: 15,
            daily_used: 0,
            daily_reset_at: new Date().toISOString().split("T")[0],
          }, {
            onConflict: "user_id",
          });

        console.log("[Webhook] Subscription activated for user:", userId);

      } else if (paymentType === "extra_requests") {
        // Получаем количество дополнительных запросов из настроек
        const { data: countSetting } = await supabase
          .from("site_settings")
          .select("value")
          .eq("id", "extra_requests_count")
          .single();

        const extraRequestsCount = countSetting?.value?.count || 10;

        // Добавляем бонусные запросы
        const { data: currentLimits } = await supabase
          .from("user_request_limits")
          .select("bonus_requests")
          .eq("user_id", userId)
          .single();

        await supabase
          .from("user_request_limits")
          .update({
            bonus_requests: (currentLimits?.bonus_requests || 0) + extraRequestsCount,
          })
          .eq("user_id", userId);

        console.log("[Webhook] Extra requests added for user:", userId, "count:", extraRequestsCount);
      }

    } else if (body.event === "payment.canceled") {
      console.log("[Webhook] Payment canceled:", payment.id);

      await supabase
        .from("payment_history")
        .update({
          status: "failed",
          yookassa_status: payment.status,
        })
        .eq("yookassa_payment_id", payment.id);
    }

    return NextResponse.json({ status: "ok" });
  } catch (e) {
    console.error("[Webhook] Exception:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET для проверки что webhook работает
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "YooKassa webhook endpoint",
    timestamp: new Date().toISOString(),
  });
}

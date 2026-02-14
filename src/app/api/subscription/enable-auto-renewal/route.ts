import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromToken } from "@/lib/supabase-admin";
import { log } from "@/lib/logger";

const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID;
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY;
const YOOKASSA_RETURN_URL = process.env.YOOKASSA_RETURN_URL || "https://jobaisearch.ru/subscription/success";

// POST /api/subscription/enable-auto-renewal - Сохранить платёжный метод для автопродления
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Проверяем что у пользователя есть активная Pro подписка
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!subscription || subscription.plan !== "pro" || subscription.status !== "active") {
      return NextResponse.json({
        error: "Автопродление можно включить только для активной Pro подписки"
      }, { status: 400 });
    }

    // Проверяем что платёжный метод ещё не сохранён
    const { data: profile } = await supabase
      .from("profiles")
      .select("yookassa_payment_method_id, email")
      .eq("user_id", userId)
      .single();

    if (profile?.yookassa_payment_method_id) {
      return NextResponse.json({
        error: "Автопродление уже включено"
      }, { status: 400 });
    }

    // Создаём платёж на 1 рубль для сохранения карты
    // Idempotence-Key должен быть не длиннее 64 символов
    const shortUserId = userId.slice(-8);
    const timestamp = Date.now().toString(36);
    const idempotenceKey = `ear-${shortUserId}-${timestamp}`;
    const authHeader = `Basic ${Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString("base64")}`;

    const paymentResponse = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotence-Key": idempotenceKey,
        "Authorization": authHeader,
      },
      body: JSON.stringify({
        amount: {
          value: "1.00",
          currency: "RUB"
        },
        capture: true,
        confirmation: {
          type: "redirect",
          return_url: YOOKASSA_RETURN_URL,
        },
        description: "Job AI Search — Привязка карты для автопродления (средства вернутся)",
        save_payment_method: true,
        metadata: {
          user_id: userId,
          type: "save_payment_method",
          auto_renewal_setup: true,
          refund_after: true,
        },
      }),
    });

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      log.error("[Enable Auto-renewal] YooKassa error:", errorText);
      return NextResponse.json({
        error: "Failed to create payment",
        details: errorText
      }, { status: 500 });
    }

    const payment = await paymentResponse.json();

    // Сохраняем запись о платеже
    await supabase.from("payment_history").insert({
      user_id: userId,
      yookassa_payment_id: payment.id,
      yookassa_status: payment.status,
      amount: 1,
      currency: "RUB",
      type: "save_payment_method",
      status: "pending",
      metadata: {
        description: "Привязка карты для автопродления",
        auto_renewal_setup: true,
      },
    });

    log.info("[Enable Auto-renewal] Created payment for user:", userId);

    return NextResponse.json({
      payment_id: payment.id,
      payment_url: payment.confirmation.confirmation_url,
    });
  } catch (e) {
    log.error("[Enable Auto-renewal] Exception:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

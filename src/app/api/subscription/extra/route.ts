import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromToken } from "@/lib/supabase-admin";

const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID;
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY;
const YOOKASSA_RETURN_URL = process.env.YOOKASSA_RETURN_URL || "https://jobaisearch.ru/subscription/success";

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!YOOKASSA_SHOP_ID || !YOOKASSA_SECRET_KEY) {
      console.error("[Extra] YooKassa not configured");
      return NextResponse.json(
        { error: "Payment system not configured" },
        { status: 500 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Проверяем что есть Pro подписка
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("plan, status")
      .eq("user_id", userId)
      .single();

    if (!subscription || subscription.plan !== "pro" || subscription.status !== "active") {
      return NextResponse.json(
        { error: "Pro subscription required to buy extra requests" },
        { status: 400 }
      );
    }

    // Получаем email пользователя
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("user_id", userId)
      .single();

    const idempotenceKey = `${userId}-extra-${Date.now()}`;

    // Создаем платеж в YooKassa
    const response = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotence-Key": idempotenceKey,
        Authorization: `Basic ${Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString("base64")}`,
      },
      body: JSON.stringify({
        amount: { value: "99.00", currency: "RUB" },
        capture: true,
        confirmation: {
          type: "redirect",
          return_url: YOOKASSA_RETURN_URL,
        },
        description: "10 дополнительных запросов",
        metadata: {
          user_id: userId,
          type: "extra_requests",
        },
        receipt: profile?.email
          ? {
              customer: { email: profile.email },
              items: [
                {
                  description: "10 дополнительных запросов",
                  quantity: "1",
                  amount: { value: "99.00", currency: "RUB" },
                  vat_code: 1,
                },
              ],
            }
          : undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[Extra] YooKassa error:", error);
      return NextResponse.json(
        { error: "Failed to create payment" },
        { status: 500 }
      );
    }

    const payment = await response.json();

    // Сохраняем историю платежа
    await supabase.from("payment_history").insert({
      user_id: userId,
      payment_id: payment.id,
      amount: 99,
      type: "extra_requests",
      status: "pending",
    });

    return NextResponse.json({
      payment_id: payment.id,
      confirmation_url: payment.confirmation.confirmation_url,
    });
  } catch (e) {
    console.error("[Extra] Exception:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

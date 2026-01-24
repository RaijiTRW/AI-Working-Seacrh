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
      console.error("[Checkout] YooKassa not configured");
      return NextResponse.json(
        { error: "Payment system not configured" },
        { status: 500 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Получаем email пользователя
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("user_id", userId)
      .single();

    const idempotenceKey = `${userId}-pro-${Date.now()}`;

    // Создаем платеж в YooKassa
    const response = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotence-Key": idempotenceKey,
        Authorization: `Basic ${Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString("base64")}`,
      },
      body: JSON.stringify({
        amount: { value: "799.00", currency: "RUB" },
        capture: true,
        confirmation: {
          type: "redirect",
          return_url: YOOKASSA_RETURN_URL,
        },
        description: "Pro подписка на 1 месяц",
        metadata: {
          user_id: userId,
          type: "subscription",
        },
        receipt: profile?.email
          ? {
              customer: { email: profile.email },
              items: [
                {
                  description: "Pro подписка на 1 месяц",
                  quantity: "1",
                  amount: { value: "799.00", currency: "RUB" },
                  vat_code: 1,
                },
              ],
            }
          : undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[Checkout] YooKassa error:", error);
      return NextResponse.json(
        { error: "Failed to create payment" },
        { status: 500 }
      );
    }

    const payment = await response.json();

    // Сохраняем историю платежа
    await supabase.from("payment_history").insert({
      user_id: userId,
      yookassa_payment_id: payment.id,
      yookassa_status: payment.status,
      amount: 799,
      currency: "RUB",
      type: "subscription",
      status: "pending",
      metadata: {
        description: "Pro подписка на 1 месяц",
        created_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      payment_id: payment.id,
      payment_url: payment.confirmation.confirmation_url,
    });
  } catch (e) {
    console.error("[Checkout] Exception:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

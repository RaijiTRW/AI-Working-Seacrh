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

    // Получаем цену дополнительных запросов из настроек
    const { data: priceSetting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("id", "extra_requests_price")
      .single();

    const extraRequestsPrice = priceSetting?.value?.price || 99;

    // Получаем количество дополнительных запросов из настроек
    const { data: countSetting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("id", "extra_requests_count")
      .single();

    const extraRequestsCount = countSetting?.value?.count || 10;
    const description = `${extraRequestsCount} дополнительных запросов`;

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
        amount: { value: `${extraRequestsPrice}.00`, currency: "RUB" },
        capture: true,
        confirmation: {
          type: "redirect",
          return_url: YOOKASSA_RETURN_URL,
        },
        description,
        metadata: {
          user_id: userId,
          type: "extra_requests",
        },
        receipt: profile?.email
          ? {
              customer: { email: profile.email },
              items: [
                {
                  description,
                  quantity: "1",
                  amount: { value: `${extraRequestsPrice}.00`, currency: "RUB" },
                  vat_code: 1,
                },
              ],
            }
          : undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
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
      amount: extraRequestsPrice,
      currency: "RUB",
      type: "extra_requests",
      status: "pending",
      metadata: {
        description,
        created_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      payment_id: payment.id,
      payment_url: payment.confirmation.confirmation_url,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

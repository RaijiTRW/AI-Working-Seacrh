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

    // Проверяем есть ли предыдущие успешные покупки подписки
    const { count: previousPurchases } = await supabase
      .from("payment_history")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", "subscription")
      .eq("status", "succeeded");

    const isFirstPurchase = (previousPurchases || 0) === 0;
    console.log(`[Checkout] User ${userId} isFirstPurchase: ${isFirstPurchase}, previousPurchases: ${previousPurchases}`);

    // Получаем настройку скидки
    let discountPercent = 0;
    let discountEnabled = false;

    const { data: discountSetting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("id", "first_purchase_discount")
      .single();

    if (discountSetting?.value) {
      discountEnabled = discountSetting.value.enabled === true;
      discountPercent = discountSetting.value.discount_percent || 0;
    }

    // Получаем цену подписки из настроек
    const { data: priceSetting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("id", "subscription_price")
      .single();

    const regularPrice = priceSetting?.value?.price || 499;
    const applyDiscount = isFirstPurchase && discountEnabled && discountPercent > 0;
    const finalPrice = applyDiscount
      ? Math.round(regularPrice * (1 - discountPercent / 100))
      : regularPrice;

    console.log(`[Checkout] Price calculation: regular=${regularPrice}, discount=${discountPercent}%, applyDiscount=${applyDiscount}, final=${finalPrice}`);

    const idempotenceKey = `${userId}-pro-${Date.now()}`;
    const description = applyDiscount
      ? `Pro подписка на 1 месяц (скидка ${discountPercent}% на первую покупку)`
      : "Pro подписка на 1 месяц";

    // Создаем платеж в YooKassa
    const response = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotence-Key": idempotenceKey,
        Authorization: `Basic ${Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString("base64")}`,
      },
      body: JSON.stringify({
        amount: { value: `${finalPrice}.00`, currency: "RUB" },
        capture: true,
        confirmation: {
          type: "redirect",
          return_url: YOOKASSA_RETURN_URL,
        },
        description,
        metadata: {
          user_id: userId,
          type: "subscription",
          is_first_purchase: isFirstPurchase,
          discount_applied: applyDiscount,
          discount_percent: applyDiscount ? discountPercent : 0,
          original_price: regularPrice,
        },
        receipt: profile?.email
          ? {
              customer: { email: profile.email },
              items: [
                {
                  description,
                  quantity: "1",
                  amount: { value: `${finalPrice}.00`, currency: "RUB" },
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
      amount: finalPrice,
      currency: "RUB",
      type: "subscription",
      status: "pending",
      metadata: {
        description,
        created_at: new Date().toISOString(),
        is_first_purchase: isFirstPurchase,
        discount_applied: applyDiscount,
        discount_percent: applyDiscount ? discountPercent : 0,
        original_price: regularPrice,
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

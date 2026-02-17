import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Публичный API для получения информации о скидке
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    // Получаем цену подписки из настроек
    let subscriptionPrice = 499; // дефолтное значение
    const { data: priceSetting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("id", "subscription_price")
      .single();

    if (priceSetting?.value && typeof priceSetting.value === 'object' && 'price' in priceSetting.value) {
      subscriptionPrice = (priceSetting.value as { price: number }).price;
    }

    const { data: discountSetting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("id", "first_purchase_discount")
      .single();

    const regularPrice = subscriptionPrice;
    let discountEnabled = false;
    let discountPercent = 0;

    if (discountSetting?.value) {
      discountEnabled = discountSetting.value.enabled === true;
      discountPercent = discountSetting.value.discount_percent || 0;
    }

    const discountedPrice = discountEnabled && discountPercent > 0
      ? Math.round(regularPrice * (1 - discountPercent / 100))
      : regularPrice;

    return NextResponse.json({
      enabled: discountEnabled && discountPercent > 0,
      percent: discountPercent,
      regular_price: regularPrice,
      discounted_price: discountedPrice,
    });
  } catch (e) {
    return NextResponse.json({
      enabled: false,
      percent: 0,
      regular_price: 499,
      discounted_price: 499,
    });
  }
}

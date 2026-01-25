import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Публичный API для получения информации о скидке
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const { data: discountSetting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("id", "first_purchase_discount")
      .single();

    const regularPrice = 799;
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
    console.error("[Discount API] Error:", e);
    return NextResponse.json({
      enabled: false,
      percent: 0,
      regular_price: 799,
      discounted_price: 799,
    });
  }
}

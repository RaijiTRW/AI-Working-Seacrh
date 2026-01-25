import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromToken } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Получаем подписку
    let { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Проверяем истечение подписки (auto-downgrade)
    if (subscription &&
        (subscription.plan === "pro" || subscription.plan === "pro_trial") &&
        subscription.status === "active" &&
        subscription.expires_at) {
      const expiresAt = new Date(subscription.expires_at);
      const now = new Date();
      if (now > expiresAt) {
        console.log(`[Subscription] Expired for user ${userId}, downgrading to base`);
        // Даунгрейд подписки
        await supabase
          .from("user_subscriptions")
          .update({
            plan: "base",
            status: "active",
            expires_at: "2099-12-31T00:00:00Z",
            can_search_online: false,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        // Даунгрейд лимитов
        await supabase
          .from("user_request_limits")
          .update({
            daily_limit: 3,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        // Re-fetch
        const { data: updated } = await supabase
          .from("user_subscriptions")
          .select("*")
          .eq("user_id", userId)
          .single();
        subscription = updated;
      }
    }

    // Получаем лимиты
    const { data: limits } = await supabase
      .from("user_request_limits")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Проверяем нужно ли сбросить дневные лимиты
    const today = new Date().toISOString().split("T")[0];
    let currentLimits = limits;

    if (limits && limits.daily_reset_at !== today) {
      // Сбрасываем дневные лимиты
      const { data: updatedLimits } = await supabase
        .from("user_request_limits")
        .update({ daily_used: 0, daily_reset_at: today })
        .eq("user_id", userId)
        .select()
        .single();
      currentLimits = updatedLimits || limits;
    }

    // Вычисляем статусы для новой системы подписок
    const plan = subscription?.plan || "base";
    const status = subscription?.status || "active";

    const isProTrial = plan === "pro_trial" && status === "active";
    const isBase = plan === "base";
    const isPro = plan === "pro" && status === "active";
    // Pro Trial истёк = сейчас на base (после истечения pro_trial)
    const isProTrialExpired = isBase;

    const dailyLimit = currentLimits?.daily_limit || 3;
    const dailyUsed = currentLimits?.daily_used || 0;
    const bonusRequests = currentLimits?.bonus_requests || 0;
    const remaining = Math.max(0, dailyLimit - dailyUsed) + bonusRequests;

    // Проверяем есть ли предыдущие успешные покупки подписки
    const { count: previousPurchases } = await supabase
      .from("payment_history")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", "subscription")
      .eq("status", "succeeded");

    const isFirstPurchase = (previousPurchases || 0) === 0;

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

    // Рассчитываем цены
    const regularPrice = 799;
    const showDiscount = isFirstPurchase && discountEnabled && discountPercent > 0 && !isPro;
    const discountedPrice = showDiscount
      ? Math.round(regularPrice * (1 - discountPercent / 100))
      : regularPrice;

    return NextResponse.json({
      subscription: subscription ? {
        ...subscription,
        can_search_online: subscription.can_search_online ?? (plan !== "base"),
      } : null,
      limits: {
        daily_limit: dailyLimit,
        daily_used: dailyUsed,
        bonus_requests: bonusRequests,
        remaining,
        can_use: remaining > 0,
      },
      is_pro_trial: isProTrial,
      is_base: isBase,
      is_pro: isPro,
      is_pro_trial_expired: isProTrialExpired,
      prices: {
        subscription: regularPrice,
        subscription_discounted: discountedPrice,
        extra_requests: 99,
        extra_requests_count: 10,
      },
      discount: {
        enabled: showDiscount,
        percent: showDiscount ? discountPercent : 0,
        is_first_purchase: isFirstPurchase,
      },
    });
  } catch (e) {
    console.error("[Subscription] Exception:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

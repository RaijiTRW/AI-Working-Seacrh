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
        const previousPlan = subscription.plan; // Сохраняем какой план истёк
        console.log(`[Subscription] Expired for user ${userId}, downgrading from ${previousPlan} to base`);
        // Даунгрейд подписки с сохранением previous_plan
        await supabase
          .from("user_subscriptions")
          .update({
            plan: "base",
            previous_plan: previousPlan, // Сохраняем предыдущий план
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

    // Проверяем есть ли предыдущие успешные покупки подписки
    const { count: previousPurchases } = await supabase
      .from("payment_history")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", "subscription")
      .eq("status", "succeeded");

    // Определяем какой план истёк
    let expiredPlanType: "pro_trial" | "pro" | null = null;
    if (isBase) {
      // Сначала проверяем previous_plan (самый надёжный способ)
      if (subscription?.previous_plan === "pro") {
        expiredPlanType = "pro";
      } else if (subscription?.previous_plan === "pro_trial") {
        expiredPlanType = "pro_trial";
      }
      // Фоллбэк на payment_history если previous_plan не установлен
      else if ((previousPurchases || 0) > 0) {
        // Была платная подписка, которая истекла
        expiredPlanType = "pro";
      } else if (subscription?.created_at) {
        // Проверяем прошло ли 3 дня с создания (период trial)
        const createdAt = new Date(subscription.created_at);
        const now = new Date();
        const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCreation > 3) {
          // Trial истёк
          expiredPlanType = "pro_trial";
        }
      }
    }

    const isProTrialExpired = expiredPlanType === "pro_trial";
    const isProExpired = expiredPlanType === "pro";

    // Debug log
    console.log(`[Subscription] Debug for user ${userId}:`, {
      plan,
      isBase,
      previous_plan: subscription?.previous_plan,
      previousPurchases,
      expiredPlanType,
      isProTrialExpired,
      isProExpired,
    });

    const dailyLimit = currentLimits?.daily_limit || 3;
    const dailyUsed = currentLimits?.daily_used || 0;
    const bonusRequests = currentLimits?.bonus_requests || 0;
    const remaining = Math.max(0, dailyLimit - dailyUsed) + bonusRequests;

    const isFirstPurchase = (previousPurchases || 0) === 0;

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

    // Получаем цену дополнительных запросов из настроек
    let extraRequestsPrice = 99; // дефолтное значение
    const { data: extraPriceSetting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("id", "extra_requests_price")
      .single();

    if (extraPriceSetting?.value && typeof extraPriceSetting.value === 'object' && 'price' in extraPriceSetting.value) {
      extraRequestsPrice = (extraPriceSetting.value as { price: number }).price;
    }

    // Получаем количество дополнительных запросов из настроек
    let extraRequestsCount = 10; // дефолтное значение
    const { data: extraCountSetting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("id", "extra_requests_count")
      .single();

    if (extraCountSetting?.value && typeof extraCountSetting.value === 'object' && 'count' in extraCountSetting.value) {
      extraRequestsCount = (extraCountSetting.value as { count: number }).count;
    }

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
    const regularPrice = subscriptionPrice;
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
      is_pro_expired: isProExpired,
      prices: {
        subscription: regularPrice,
        subscription_discounted: discountedPrice,
        extra_requests: extraRequestsPrice,
        extra_requests_count: extraRequestsCount,
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

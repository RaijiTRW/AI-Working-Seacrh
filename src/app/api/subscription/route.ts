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
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

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
        subscription: 799,
        extra_requests: 99,
        extra_requests_count: 10,
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

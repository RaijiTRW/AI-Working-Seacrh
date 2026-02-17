import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromToken } from "@/lib/supabase-admin";

async function isAdmin(userId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .single();
  return data?.role === "admin";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const adminId = await getUserFromToken(request);
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(adminId))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { userId } = await params;
    const { subscription_type, expires_at } = await request.json();

    const supabase = getSupabaseAdmin();

    // Определяем параметры подписки
    let dailyLimit = 3;
    let days = 0;
    let canSearchOnline = false;

    if (subscription_type === "base") {
      dailyLimit = 3;
      days = 0; // Бессрочно
      canSearchOnline = false;
    } else if (subscription_type === "pro_trial") {
      dailyLimit = 15;
      days = 7;
      canSearchOnline = true;
    } else if (subscription_type === "pro") {
      dailyLimit = 15;
      days = 30;
      canSearchOnline = true;
    }

    // Вычисляем дату истечения
    const expiresAt = expires_at || (
      days > 0
        ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
        : "2099-12-31T00:00:00Z" // Бессрочно для base
    );

    // Upsert в user_subscriptions
    await supabase.from("user_subscriptions").upsert({
      user_id: userId,
      plan: subscription_type,
      status: "active",
      started_at: new Date().toISOString(),
      expires_at: expiresAt,
      can_search_online: canSearchOnline,
      updated_at: new Date().toISOString(),
    });

    // Upsert в user_request_limits
    await supabase.from("user_request_limits").upsert({
      user_id: userId,
      daily_limit: dailyLimit,
      daily_used: 0,
      daily_reset_at: new Date().toISOString().split("T")[0],
      bonus_requests: 0,
      updated_at: new Date().toISOString(),
    });

    // Обновляем profiles для отображения
    await supabase
      .from("profiles")
      .update({
        subscription_type,
        subscription_expires_at: expiresAt,
      })
      .eq("user_id", userId);

    return NextResponse.json({ success: true, subscription_type });
  } catch (e) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

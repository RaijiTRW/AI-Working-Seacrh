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
    let dailyLimit = 0;
    let days = 0;

    if (subscription_type === "trial") {
      dailyLimit = 3;
      days = 3;
    } else if (subscription_type === "pro") {
      dailyLimit = 10;
      days = 30;
    }

    if (subscription_type) {
      const expiresAt = expires_at || new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

      // Upsert в user_subscriptions
      await supabase.from("user_subscriptions").upsert({
        user_id: userId,
        plan: subscription_type,
        status: "active",
        started_at: new Date().toISOString(),
        expires_at: expiresAt,
      });

      // Upsert в user_request_limits
      await supabase.from("user_request_limits").upsert({
        user_id: userId,
        daily_limit: dailyLimit,
        daily_used: 0,
        daily_reset_at: new Date().toISOString().split("T")[0],
        bonus_requests: 0,
      });

      // Обновляем profiles для отображения
      await supabase
        .from("profiles")
        .update({
          subscription_type,
          subscription_expires_at: expiresAt,
        })
        .eq("user_id", userId);
    } else {
      // Удаляем подписку
      await supabase
        .from("user_subscriptions")
        .delete()
        .eq("user_id", userId);

      await supabase
        .from("user_request_limits")
        .delete()
        .eq("user_id", userId);

      await supabase
        .from("profiles")
        .update({
          subscription_type: null,
          subscription_expires_at: null,
        })
        .eq("user_id", userId);
    }

    return NextResponse.json({ success: true, subscription_type });
  } catch (e) {
    console.error("[Admin Subscription] Exception:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

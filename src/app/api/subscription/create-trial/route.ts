import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromToken } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Проверяем нет ли уже подписки
    const { data: existingSub } = await supabase
      .from("user_subscriptions")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (existingSub) {
      return NextResponse.json(
        { error: "Subscription already exists" },
        { status: 400 }
      );
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 3);

    // Создаем триал подписку
    const { error: subError } = await supabase.from("user_subscriptions").insert({
      user_id: userId,
      plan: "trial",
      status: "active",
      expires_at: expiresAt.toISOString(),
    });

    if (subError) {
      console.error("[Create Trial] Sub error:", subError);
      return NextResponse.json(
        { error: "Failed to create trial" },
        { status: 500 }
      );
    }

    // Создаем лимиты
    const { error: limitsError } = await supabase
      .from("user_request_limits")
      .insert({
        user_id: userId,
        daily_limit: 3,
        daily_used: 0,
        daily_reset_at: new Date().toISOString().split("T")[0],
        bonus_requests: 0,
      });

    if (limitsError) {
      console.error("[Create Trial] Limits error:", limitsError);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[Create Trial] Exception:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

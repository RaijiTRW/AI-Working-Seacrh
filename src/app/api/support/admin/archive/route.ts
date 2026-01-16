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

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(userId))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    // Получаем закрытые чаты
    const { data: chats, error } = await supabase
      .from("support_chats")
      .select("*")
      .eq("status", "closed")
      .order("closed_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[Admin Archive] Error:", error);
      return NextResponse.json({ chats: [] });
    }

    // Добавляем email и подписку пользователей
    const enrichedChats = await Promise.all(
      (chats || []).map(async (chat) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .eq("user_id", chat.user_id)
          .single();

        // Подписка пользователя
        const { data: subscription } = await supabase
          .from("user_subscriptions")
          .select("plan, status")
          .eq("user_id", chat.user_id)
          .single();

        const isPro = subscription?.plan === "pro" && subscription?.status === "active";

        return {
          ...chat,
          user_email: profile?.email || null,
          subscription_plan: subscription?.plan || "free",
          is_pro: isPro,
        };
      })
    );

    return NextResponse.json({ chats: enrichedChats });
  } catch (e) {
    console.error("[Admin Archive] Exception:", e);
    return NextResponse.json({ chats: [] });
  }
}

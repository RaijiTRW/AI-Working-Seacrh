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

    // Получаем активные чаты
    const { data: chats, error } = await supabase
      .from("support_chats")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ chats: [] });
    }

    // Добавляем информацию о пользователях, подписке и сообщениях
    const enrichedChats = await Promise.all(
      (chats || []).map(async (chat) => {
        // Email пользователя
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

        // Последнее сообщение
        const { data: lastMsg } = await supabase
          .from("support_messages")
          .select("content")
          .eq("chat_id", chat.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        // Непрочитанные от пользователя
        const { count } = await supabase
          .from("support_messages")
          .select("*", { count: "exact", head: true })
          .eq("chat_id", chat.id)
          .eq("sender_type", "user")
          .eq("is_read", false);

        const isPro = subscription?.plan === "pro" && subscription?.status === "active";

        return {
          ...chat,
          user_email: profile?.email || null,
          subscription_plan: subscription?.plan || "free",
          is_pro: isPro,
          last_message: lastMsg?.content?.slice(0, 100) || null,
          unread_count: count || 0,
        };
      })
    );

    // Сортируем: Pro пользователи первыми, потом по дате
    const sortedChats = enrichedChats.sort((a, b) => {
      // Pro первыми
      if (a.is_pro && !b.is_pro) return -1;
      if (!a.is_pro && b.is_pro) return 1;
      // Потом по непрочитанным
      if ((a.unread_count || 0) > 0 && (b.unread_count || 0) === 0) return -1;
      if ((a.unread_count || 0) === 0 && (b.unread_count || 0) > 0) return 1;
      // Потом по дате
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return NextResponse.json({ chats: sortedChats });
  } catch (e) {
    return NextResponse.json({ chats: [] });
  }
}

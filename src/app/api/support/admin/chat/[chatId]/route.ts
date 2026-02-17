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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(userId))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { chatId } = await params;
    const supabase = getSupabaseAdmin();

    // Получаем чат
    const { data: chat, error: chatError } = await supabase
      .from("support_chats")
      .select("*")
      .eq("id", chatId)
      .single();

    if (chatError || !chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Получаем email пользователя
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("user_id", chat.user_id)
      .single();

    // Получаем подписку пользователя
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("plan, status")
      .eq("user_id", chat.user_id)
      .single();

    const isPro = subscription?.plan === "pro" && subscription?.status === "active";

    // Получаем сообщения
    const { data: messages } = await supabase
      .from("support_messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    // Отмечаем сообщения от пользователя как прочитанные
    await supabase
      .from("support_messages")
      .update({ is_read: true })
      .eq("chat_id", chatId)
      .eq("sender_type", "user")
      .eq("is_read", false);

    return NextResponse.json({
      chat: {
        ...chat,
        user_email: profile?.email || null,
        subscription_plan: subscription?.plan || "free",
        is_pro: isPro,
      },
      messages: messages || [],
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

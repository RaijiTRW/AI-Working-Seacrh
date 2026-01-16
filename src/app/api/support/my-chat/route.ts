import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromToken } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Получаем последний чат пользователя (активный или закрытый)
    const { data: chat } = await supabase
      .from("support_chats")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["active", "closed"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!chat) {
      return NextResponse.json({ chat: null, messages: [] });
    }

    // Получаем сообщения
    const { data: messages } = await supabase
      .from("support_messages")
      .select("*")
      .eq("chat_id", chat.id)
      .order("created_at", { ascending: true });

    // Отмечаем сообщения от админа как прочитанные (только для активных чатов)
    if (chat.status === "active") {
      await supabase
        .from("support_messages")
        .update({ is_read: true })
        .eq("chat_id", chat.id)
        .eq("sender_type", "admin")
        .eq("is_read", false);
    }

    return NextResponse.json({
      chat,
      messages: messages || [],
    });
  } catch (e) {
    console.error("[My Chat] Exception:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

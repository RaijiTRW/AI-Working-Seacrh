import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromToken } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chat_id, message } = await request.json();
    if (!chat_id || !message) {
      return NextResponse.json(
        { error: "chat_id and message required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Проверяем что чат принадлежит пользователю
    const { data: chat } = await supabase
      .from("support_chats")
      .select("user_id, status")
      .eq("id", chat_id)
      .single();

    if (!chat || chat.user_id !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (chat.status !== "active") {
      return NextResponse.json({ error: "Chat is closed" }, { status: 400 });
    }

    // Добавляем сообщение
    const { data: newMessage, error } = await supabase
      .from("support_messages")
      .insert({
        chat_id,
        sender_type: "user",
        sender_id: userId,
        content: message,
      })
      .select()
      .single();

    if (error) {
      console.error("[Send Message] Error:", error);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: newMessage });
  } catch (e) {
    console.error("[Send Message] Exception:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

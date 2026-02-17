import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromToken } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const { chat_id, message, guest_id } = await request.json();
    if (!chat_id || !message) {
      return NextResponse.json(
        { error: "chat_id and message required" },
        { status: 400 }
      );
    }

    // Проверяем авторизацию или guest_id
    const userId = await getUserFromToken(request);
    const effectiveUserId = userId || guest_id;

    if (!effectiveUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Проверяем что чат принадлежит пользователю (или гостю)
    const { data: chat } = await supabase
      .from("support_chats")
      .select("user_id, guest_id, status")
      .eq("id", chat_id)
      .single();

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Проверяем доступ: либо user_id совпадает, либо guest_id совпадает
    const hasAccess =
      (userId && chat.user_id === userId) ||
      (guest_id && chat.guest_id === guest_id) ||
      (!userId && !guest_id && chat.user_id === null && chat.guest_id === null);

    if (!hasAccess) {
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
        sender_id: userId || null, // NULL для гостей
        content: message,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: newMessage });
  } catch (e) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

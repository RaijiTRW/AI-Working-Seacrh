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

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(userId))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { chat_id, message } = await request.json();
    if (!chat_id || !message) {
      return NextResponse.json(
        { error: "chat_id and message required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Проверяем что чат существует и активен
    const { data: chat } = await supabase
      .from("support_chats")
      .select("status")
      .eq("id", chat_id)
      .single();

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    if (chat.status !== "active") {
      return NextResponse.json({ error: "Chat is closed" }, { status: 400 });
    }

    // Добавляем сообщение от админа
    const { data: newMessage, error } = await supabase
      .from("support_messages")
      .insert({
        chat_id,
        sender_type: "admin",
        sender_id: userId,
        content: message,
      })
      .select()
      .single();

    if (error) {
      console.error("[Admin Send Message] Error:", error);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: newMessage });
  } catch (e) {
    console.error("[Admin Send Message] Exception:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

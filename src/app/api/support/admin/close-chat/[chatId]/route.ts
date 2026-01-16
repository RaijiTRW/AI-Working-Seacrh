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

    // Проверяем что чат существует и активен
    const { data: chat } = await supabase
      .from("support_chats")
      .select("status")
      .eq("id", chatId)
      .single();

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    if (chat.status !== "active") {
      return NextResponse.json({ error: "Chat already closed" }, { status: 400 });
    }

    // Добавляем AI сообщение о закрытии
    await supabase.from("support_messages").insert({
      chat_id: chatId,
      sender_type: "ai",
      content:
        "Чат завершён администратором. Спасибо за обращение! Пожалуйста, оцените качество поддержки (от 1 до 5 звёзд).",
    });

    // Закрываем чат
    const { error } = await supabase
      .from("support_chats")
      .update({
        status: "closed",
        admin_id: userId,
        closed_at: new Date().toISOString(),
      })
      .eq("id", chatId);

    if (error) {
      console.error("[Admin Close Chat] Error:", error);
      return NextResponse.json(
        { error: "Failed to close chat" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[Admin Close Chat] Exception:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

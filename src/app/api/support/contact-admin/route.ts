import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromToken } from "@/lib/supabase-admin";

interface PreviousMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Получаем предыдущие сообщения из AI-чата
    let previousMessages: PreviousMessage[] = [];
    try {
      const body = await request.json();
      previousMessages = body.previous_messages || [];
    } catch {
      // Нет тела запроса - ок
    }

    const supabase = getSupabaseAdmin();

    // Проверяем, нет ли уже активного чата
    const { data: existingChat } = await supabase
      .from("support_chats")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (existingChat) {
      return NextResponse.json({
        chat_id: existingChat.id,
        message: "У вас уже есть активный чат с поддержкой",
        is_existing: true,
      });
    }

    // Создаем новый чат
    const { data: newChat, error: chatError } = await supabase
      .from("support_chats")
      .insert({ user_id: userId, status: "active" })
      .select("id")
      .single();

    if (chatError || !newChat) {
      console.error("[Contact Admin] Chat creation error:", chatError);
      return NextResponse.json(
        { error: "Failed to create support chat" },
        { status: 500 }
      );
    }

    // Сохраняем предыдущую переписку с AI (если есть)
    if (previousMessages.length > 0) {
      const messagesToInsert = previousMessages.map((msg) => ({
        chat_id: newChat.id,
        sender_type: msg.role === "user" ? "user" : "ai",
        content: msg.content,
      }));

      await supabase.from("support_messages").insert(messagesToInsert);
    }

    // Добавляем системное сообщение о переходе к админу
    await supabase.from("support_messages").insert({
      chat_id: newChat.id,
      sender_type: "ai",
      content:
        "Вы подключены к чату с администрацией. Опишите ваш вопрос, и администратор ответит вам в ближайшее время.",
    });

    return NextResponse.json({
      chat_id: newChat.id,
      message: "Чат с поддержкой создан",
      is_existing: false,
    });
  } catch (e) {
    console.error("[Contact Admin] Exception:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

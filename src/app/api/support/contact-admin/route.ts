import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromToken } from "@/lib/supabase-admin";

interface PreviousMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    // Проверяем авторизацию или guest_id
    const userId = await getUserFromToken(request);

    // Получаем данные из тела запроса
    let previousMessages: PreviousMessage[] = [];
    let guestId: string | null = null;

    try {
      const body = await request.json();
      previousMessages = body.previous_messages || [];
      guestId = body.guest_id || null;
    } catch {
      // Нет тела запроса - ок
    }

    const effectiveUserId = userId || guestId;

    if (!effectiveUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Проверяем, нет ли уже активного чата
    let query = supabase
      .from("support_chats")
      .select("id")
      .eq("status", "active");

    if (userId) {
      query = query.eq("user_id", userId);
    } else if (guestId) {
      query = query.eq("guest_id", guestId);
    }

    const { data: existingChat } = await query.single();

    if (existingChat) {
      return NextResponse.json({
        chat_id: existingChat.id,
        message: userId ? "У вас уже есть активный чат с поддержкой" : "У вас уже есть активный чат с поддержкой",
        is_existing: true,
      });
    }

    // Создаем новый чат
    const chatData: Record<string, any> = {
      status: "active",
    };

    if (userId) {
      chatData.user_id = userId;
    }

    if (guestId) {
      chatData.guest_id = guestId;
    }

    const { data: newChat, error: chatError } = await supabase
      .from("support_chats")
      .insert(chatData)
      .select("id")
      .single();

    if (chatError || !newChat) {
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

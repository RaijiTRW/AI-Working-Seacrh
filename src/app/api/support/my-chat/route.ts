import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromToken } from "@/lib/supabase-admin";

async function getChat(supabase: any, userId: string | null, guestId: string | null) {
  let query = supabase
    .from("support_chats")
    .select("*")
    .in("status", ["active", "closed"])
    .order("created_at", { ascending: false })
    .limit(1);

  if (userId) {
    query = query.eq("user_id", userId);
  } else if (guestId) {
    query = query.eq("guest_id", guestId);
  } else {
    return null;
  }

  const { data: chat } = await query.single();
  return chat;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const chat = await getChat(supabase, userId, null);

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
    console.error("[My Chat GET] Exception:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { guest_id } = await request.json();

    if (!guest_id) {
      return NextResponse.json({ error: "guest_id required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const chat = await getChat(supabase, null, guest_id);

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
    console.error("[My Chat POST] Exception:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

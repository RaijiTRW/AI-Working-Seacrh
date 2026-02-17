import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromToken } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chat_id, rating } = await request.json();
    if (!chat_id || !rating) {
      return NextResponse.json(
        { error: "chat_id and rating required" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be 1-5" },
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

    if (chat.status !== "closed") {
      return NextResponse.json(
        { error: "Can only rate closed chats" },
        { status: 400 }
      );
    }

    // Обновляем рейтинг
    const { error } = await supabase
      .from("support_chats")
      .update({
        rating,
        feedback_submitted_at: new Date().toISOString(),
      })
      .eq("id", chat_id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to rate chat" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

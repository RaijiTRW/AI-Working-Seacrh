import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromToken } from "@/lib/supabase-admin";

// GET /api/conversations/[id]/messages - Get messages for conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserFromToken(request);

    if (!userId) {
      return NextResponse.json(
        { detail: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 50;
    const offset = (page - 1) * limit;

    const supabase = getSupabaseAdmin();

    // Verify user has access to this conversation
    const { data: conversation } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (!conversation) {
      return NextResponse.json(
        { detail: "Conversation not found" },
        { status: 404 }
      );
    }

    if (conversation.applicant_id !== userId && conversation.employer_id !== userId) {
      return NextResponse.json(
        { detail: "Access denied" },
        { status: 403 }
      );
    }

    // Get messages (newest first for pagination, will reverse on client)
    const { data: messages, error, count } = await supabase
      .from("conversation_messages")
      .select("*", { count: "exact" })
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Get messages error:", error);
      return NextResponse.json(
        { detail: error.message },
        { status: 400 }
      );
    }

    const total = count || 0;
    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      messages: messages || [],
      total,
      page,
      pages,
    });
  } catch (err) {
    console.error("GET messages error:", err);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/conversations/[id]/messages - Send a message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserFromToken(request);

    if (!userId) {
      return NextResponse.json(
        { detail: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: conversationId } = await params;
    const body = await request.json();
    const content = body.content?.trim();

    if (!content) {
      return NextResponse.json(
        { detail: "Message content is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Verify user has access to this conversation
    const { data: conversation } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (!conversation) {
      return NextResponse.json(
        { detail: "Conversation not found" },
        { status: 404 }
      );
    }

    if (conversation.applicant_id !== userId && conversation.employer_id !== userId) {
      return NextResponse.json(
        { detail: "Access denied" },
        { status: 403 }
      );
    }

    // Create message
    const { data: message, error: messageError } = await supabase
      .from("conversation_messages")
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content,
      })
      .select()
      .single();

    if (messageError) {
      console.error("Send message error:", messageError);
      return NextResponse.json(
        { detail: messageError.message },
        { status: 400 }
      );
    }

    // Update last_message_at and increment unread count for recipient
    const isApplicant = conversation.applicant_id === userId;
    const unreadField = isApplicant ? "employer_unread_count" : "applicant_unread_count";
    const currentUnread = isApplicant
      ? conversation.employer_unread_count || 0
      : conversation.applicant_unread_count || 0;

    await supabase
      .from("conversations")
      .update({
        last_message_at: new Date().toISOString(),
        [unreadField]: currentUnread + 1,
      })
      .eq("id", conversationId);

    return NextResponse.json(message);
  } catch (err) {
    console.error("POST message error:", err);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
}

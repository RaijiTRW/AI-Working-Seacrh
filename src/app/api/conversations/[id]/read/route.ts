import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromToken } from "@/lib/supabase-admin";

// POST /api/conversations/[id]/read - Mark messages as read
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

    // Reset unread count for this user
    const isApplicant = conversation.applicant_id === userId;
    const updateField = isApplicant ? "applicant_unread_count" : "employer_unread_count";

    const { error: updateError } = await supabase
      .from("conversations")
      .update({ [updateField]: 0 })
      .eq("id", conversationId);

    if (updateError) {
      return NextResponse.json(
        { detail: updateError.message },
        { status: 400 }
      );
    }

    // Mark all messages as read
    const { error: messagesError } = await supabase
      .from("conversation_messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId);

    if (messagesError) {
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
}

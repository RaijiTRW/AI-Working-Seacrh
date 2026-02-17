import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromToken } from "@/lib/supabase-admin";

// GET /api/conversations/unread - Get total unread count
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);

    if (!userId) {
      return NextResponse.json({ count: 0 });
    }

    const supabase = getSupabaseAdmin();

    // Get all conversations for this user
    const { data: conversations, error } = await supabase
      .from("conversations")
      .select("applicant_id, employer_id, applicant_unread_count, employer_unread_count")
      .or(`applicant_id.eq.${userId},employer_id.eq.${userId}`);

    if (error) {
      return NextResponse.json({ count: 0 });
    }

    // Sum up unread counts for this user
    let totalUnread = 0;
    for (const conv of conversations || []) {
      if (conv.applicant_id === userId) {
        totalUnread += conv.applicant_unread_count || 0;
      } else if (conv.employer_id === userId) {
        totalUnread += conv.employer_unread_count || 0;
      }
    }

    return NextResponse.json({ count: totalUnread });
  } catch (err) {
    return NextResponse.json({ count: 0 });
  }
}

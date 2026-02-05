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

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(userId))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    const supabase = getSupabaseAdmin();

    // Get chats with user email from user_subscription_status
    let query = supabase
      .from("chats")
      .select(`
        *,
        user_subscription_status!inner(email)
      `, { count: "exact" })
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply search filter
    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    const { data: chats, count, error } = await query;

    if (error) {
      console.error("[Admin Chats] Error:", error);
      return NextResponse.json({ chats: [], total: 0, page, pages: 0 });
    }

    const total = count || 0;
    const pages = Math.ceil(total / limit);

    // Format chats with email and get message counts
    const formattedChats = await Promise.all(
      (chats || []).map(async (chat: any) => {
        // Get message count for each chat
        const { count: messageCount } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("chat_id", chat.id);

        return {
          ...chat,
          email: chat.user_subscription_status?.email || "",
          message_count: messageCount || 0,
        };
      })
    );

    return NextResponse.json({
      chats: formattedChats,
      total,
      page,
      pages,
    });
  } catch (e) {
    console.error("[Admin Chats] Exception:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

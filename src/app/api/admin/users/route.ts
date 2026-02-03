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

    // Join with user_subscription_status to get email, daily_limit, daily_used, and bonus_requests
    let query = supabase
      .from("profiles")
      .select(`
        *,
        user_subscription_status!inner(
          email,
          daily_limit,
          daily_used,
          bonus_requests
        )
      `, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    const { data: users, count, error } = await query;

    if (error) {
      console.error("[Admin Users] Error:", error);
      return NextResponse.json({ users: [], total: 0, page, pages: 0 });
    }

    const total = count || 0;
    const pages = Math.ceil(total / limit);

    // Flatten user_subscription_status data into user object
    const formattedUsers = (users || []).map((user: any) => ({
      ...user,
      email: user.user_subscription_status?.email || "",
      daily_limit: user.user_subscription_status?.daily_limit || 0,
      daily_used: user.user_subscription_status?.daily_used || 0,
      bonus_requests: user.user_subscription_status?.bonus_requests || 0,
    }));

    return NextResponse.json({
      users: formattedUsers,
      total,
      page,
      pages,
    });
  } catch (e) {
    console.error("[Admin Users] Exception:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

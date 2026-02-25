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

type ProfileRow = {
  id: string;
  user_id: string;
  full_name?: string | null;
  role?: string | null;
  is_banned?: boolean | null;
  ban_reason?: string | null;
  can_create_vacancies?: boolean | null;
  subscription_type?: string | null;
  subscription_expires_at?: string | null;
  last_seen_at?: string | null;
  created_at?: string | null;
};

type SubscriptionStatusRow = {
  user_id: string;
  email?: string | null;
  daily_limit?: number | null;
  daily_used?: number | null;
  bonus_requests?: number | null;
};

const PROFILE_SELECT = `
  id,
  user_id,
  full_name,
  role,
  is_banned,
  ban_reason,
  can_create_vacancies,
  subscription_type,
  subscription_expires_at,
  last_seen_at,
  created_at
`;

async function getSubscriptionStatusMap(userIds: string[]) {
  const supabase = getSupabaseAdmin();
  const map = new Map<string, SubscriptionStatusRow>();

  if (userIds.length === 0) return map;

  const { data, error } = await supabase
    .from("user_subscription_status")
    .select("user_id, email, daily_limit, daily_used, bonus_requests")
    .in("user_id", userIds);

  if (error) {
    // Не валим выдачу пользователей, если view/relationship недоступны.
    console.error("[admin/users] user_subscription_status query failed:", error.message);
    return map;
  }

  for (const row of (data || []) as SubscriptionStatusRow[]) {
    if (row.user_id) map.set(row.user_id, row);
  }

  return map;
}

function formatUsers(profiles: ProfileRow[], statusMap: Map<string, SubscriptionStatusRow>) {
  return profiles.map((user) => {
    const status = statusMap.get(user.user_id);
    return {
      ...user,
      role: user.role || "user",
      is_banned: Boolean(user.is_banned),
      can_create_vacancies: user.can_create_vacancies ?? true,
      email: status?.email || "",
      daily_limit: status?.daily_limit || 0,
      daily_used: status?.daily_used || 0,
      bonus_requests: status?.bonus_requests || 0,
    };
  });
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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
    const search = (searchParams.get("search") || "").trim();
    const offset = (page - 1) * limit;

    const supabase = getSupabaseAdmin();

    let profiles: ProfileRow[] = [];
    let total = 0;

    if (search) {
      // 1) Поиск по профилям (имя / user_id)
      let matchedUserIds = new Set<string>();

      const { data: profileMatches, error: profileSearchError } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .or(`full_name.ilike.%${search}%,user_id.ilike.%${search}%`)
        .limit(1000);

      if (profileSearchError) {
        console.error("[admin/users] profile search failed:", profileSearchError.message);
      } else {
        for (const row of (profileMatches || []) as Array<{ user_id: string }>) {
          if (row.user_id) matchedUserIds.add(row.user_id);
        }
      }

      // 2) Поиск по email в user_subscription_status (без embedded join)
      const { data: emailMatches, error: emailSearchError } = await supabase
        .from("user_subscription_status")
        .select("user_id")
        .ilike("email", `%${search}%`)
        .limit(1000);

      if (emailSearchError) {
        console.error("[admin/users] email search failed:", emailSearchError.message);
      } else {
        for (const row of (emailMatches || []) as Array<{ user_id: string }>) {
          if (row.user_id) matchedUserIds.add(row.user_id);
        }
      }

      const matchedIds = Array.from(matchedUserIds);

      if (matchedIds.length > 0) {
        const { data: pageProfiles, count: matchedCount, error: profilesError } = await supabase
          .from("profiles")
          .select(PROFILE_SELECT, { count: "exact" })
          .in("user_id", matchedIds)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (profilesError) {
          console.error("[admin/users] profiles page fetch failed:", profilesError.message);
          return NextResponse.json({ users: [], total: 0, page, pages: 0 });
        }

        profiles = (pageProfiles || []) as ProfileRow[];
        total = matchedCount || matchedIds.length;
      }
    } else {
      const { data: pageProfiles, count, error: profilesError } = await supabase
        .from("profiles")
        .select(PROFILE_SELECT, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (profilesError) {
        console.error("[admin/users] profiles fetch failed:", profilesError.message);
        return NextResponse.json({ users: [], total: 0, page, pages: 0 });
      }

      profiles = (pageProfiles || []) as ProfileRow[];
      total = count || 0;
    }

    const statusMap = await getSubscriptionStatusMap(
      profiles.map((p) => p.user_id).filter(Boolean)
    );
    const formattedUsers = formatUsers(profiles, statusMap);
    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      users: formattedUsers,
      total,
      page,
      pages,
    });
  } catch (e) {
    console.error("[admin/users] unexpected error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

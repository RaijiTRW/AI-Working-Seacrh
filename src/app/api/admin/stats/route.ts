import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromToken } from "@/lib/supabase-admin";
import { log } from "@/lib/logger";

async function isAdmin(userId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .single();

  log.info("[isAdmin] Checking userId:", userId);
  log.info("[isAdmin] Profile data:", data);
  log.info("[isAdmin] Error:", error);
  log.info("[isAdmin] Is admin:", data?.role === "admin");

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

    const supabase = getSupabaseAdmin();

    // Общее количество пользователей
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Онлайн (последние 5 минут)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count: onlineUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("last_seen_at", fiveMinutesAgo);

    // Забаненные
    const { count: bannedUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_banned", true);

    // Админы
    const { count: adminsCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");

    // Вакансии платформы
    const { count: platformVacancies } = await supabase
      .from("employer_vacancies")
      .select("*", { count: "exact", head: true })
      .eq("status", "published");

    return NextResponse.json({
      total_users: totalUsers || 0,
      online_users: onlineUsers || 0,
      banned_users: bannedUsers || 0,
      admins_count: adminsCount || 0,
      platform_vacancies: platformVacancies || 0,
    });
  } catch (e) {
    log.error("[Admin Stats] Exception:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

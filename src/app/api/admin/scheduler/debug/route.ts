import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/admin/scheduler/debug
 * Отладочный роут - проверка состояния scheduler таблиц
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if tables exist and have data
    const checks: Record<string, any> = {};

    // Check scheduler_job_history
    try {
      const { data: historyData, error: historyError } = await supabase
        .from("scheduler_job_history")
        .select("*", { count: "exact", head: false })
        .limit(5);

      checks.scheduler_job_history = {
        exists: !historyError || historyError.code !== "PGRST116",
        count: historyData?.length || 0,
        error: historyError?.message,
        recent: historyData || [],
      };
    } catch (e: any) {
      checks.scheduler_job_history = {
        exists: false,
        error: e.message,
      };
    }

    // Check vacancy_volume_stats
    try {
      const { data: volumeData, error: volumeError } = await supabase
        .from("vacancy_volume_stats")
        .select("*", { count: "exact", head: false })
        .limit(5);

      checks.vacancy_volume_stats = {
        exists: !volumeError || volumeError.code !== "PGRST116",
        count: volumeData?.length || 0,
        error: volumeError?.message,
        recent: volumeData || [],
      };
    } catch (e: any) {
      checks.vacancy_volume_stats = {
        exists: false,
        error: e.message,
      };
    }

    // Check scheduler_job_state
    try {
      const { data: stateData, error: stateError } = await supabase
        .from("scheduler_job_state")
        .select("*");

      checks.scheduler_job_state = {
        exists: !stateError || stateError.code !== "PGRST116",
        count: stateData?.length || 0,
        error: stateError?.message,
        states: stateData || [],
      };
    } catch (e: any) {
      checks.scheduler_job_state = {
        exists: false,
        error: e.message,
      };
    }

    // Check if Python backend is reachable
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    let backendStatus = "unknown";
    try {
      const backendResponse = await fetch(`${backendUrl}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      backendStatus = backendResponse.ok ? "ok" : "error";
    } catch {
      backendStatus = "unreachable";
    }

    checks.backend = {
      url: backendUrl,
      status: backendStatus,
    };

    return NextResponse.json(checks);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/scheduler/debug
 * Создать тестовые данные для проверки UI
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const results: Record<string, any> = {};

    // Insert sample job history
    const now = new Date();
    const sampleHistory = [
      {
        job_id: "mass_parsing_job",
        job_name: "Mass HH/SuperJob Parsing",
        status: "completed",
        started_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        ended_at: new Date(now.getTime() - 1.8 * 60 * 60 * 1000).toISOString(),
        duration_seconds: 720,
        stats: {
          hh: { parsed: 4500, saved: 4200, requests: 25 },
          superjob: { parsed: 800, saved: 750, requests: 25 },
          total_saved: 4950,
          unique_queries: ["программист", "разработчик", "developer"],
          unique_cities: ["Москва", "Санкт-Петербург"],
        },
      },
      {
        job_id: "verification_job",
        job_name: "Vacancy Verification",
        status: "completed",
        started_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
        ended_at: new Date(now.getTime() - 0.9 * 60 * 60 * 1000).toISOString(),
        duration_seconds: 360,
        stats: {
          checked: 50,
          marked_inactive: 5,
          still_active: 45,
        },
      },
    ];

    for (const entry of sampleHistory) {
      const { error } = await supabase
        .from("scheduler_job_history")
        .insert(entry);
      results.history_insert = error ? { error: error.message } : "success";
    }

    // Insert sample volume stats (for the last 24 hours, every 4 hours)
    const volumeStats = [];
    for (let i = 6; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 4 * 60 * 60 * 1000);
      const hh = 4000 + Math.floor(Math.random() * 1000);
      const superjob = 700 + Math.floor(Math.random() * 200);
      const avito = 100 + Math.floor(Math.random() * 50);
      const platform = 50 + Math.floor(Math.random() * 20);
      const total = hh + superjob + avito + platform;

      volumeStats.push(
        { recorded_at: timestamp.toISOString(), source: "hh", count: hh },
        { recorded_at: timestamp.toISOString(), source: "superjob", count: superjob },
        { recorded_at: timestamp.toISOString(), source: "avito", count: avito },
        { recorded_at: timestamp.toISOString(), source: "platform", count: platform },
        { recorded_at: timestamp.toISOString(), source: "total", count: total },
      );
    }

    const { error: volumeError } = await supabase
      .from("vacancy_volume_stats")
      .insert(volumeStats);
    results.volume_insert = volumeError ? { error: volumeError.message } : `${volumeStats.length} records`;

    return NextResponse.json({
      success: true,
      results,
      message: "Sample data created. Refresh the page to see it.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

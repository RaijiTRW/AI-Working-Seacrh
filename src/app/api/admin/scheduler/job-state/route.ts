import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/admin/scheduler/job-state
 * Прямое чтение состояния джобов из Supabuse (минуя Python backend)
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");

    // Проверка авторизации (базовая)
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Читаем напрямую из Supabuse
    const url = new URL("/rest/v1/scheduler_job_state", SUPABASE_URL);
    url.searchParams.set("select", "*");

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Job State] Supabase error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to fetch job state" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Преобразуем в объект { job_id: { is_paused, ... } }
    const stateMap: Record<string, { is_paused: boolean }> = {};
    for (const row of data) {
      stateMap[row.job_id] = {
        is_paused: row.is_paused || false,
      };
    }

    // Отключаем кэширование
    return NextResponse.json(stateMap, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[Job State] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

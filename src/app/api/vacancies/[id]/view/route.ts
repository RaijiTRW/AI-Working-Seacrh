import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const VIEW_COOKIE = "jobsearch_viewed_vacancies";
const VIEW_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const MAX_COOKIE_ENTRIES = 50;

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function readViewCookie(request: NextRequest): Record<string, number> {
  const raw = request.cookies.get(VIEW_COOKIE)?.value;
  if (!raw) return {};

  const decoded = safeJsonParse<Record<string, number>>(decodeURIComponent(raw));
  if (!decoded || typeof decoded !== "object") return {};

  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(decoded)) {
    const ts = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(ts)) result[key] = ts;
  }
  return result;
}

function writeViewCookie(
  response: NextResponse,
  views: Record<string, number>
) {
  const now = Date.now();

  // prune expired
  for (const [key, ts] of Object.entries(views)) {
    if (!Number.isFinite(ts) || now - ts > VIEW_TTL_MS) delete views[key];
  }

  // enforce size limit (drop oldest)
  const entries = Object.entries(views).sort((a, b) => a[1] - b[1]);
  const overflow = Math.max(0, entries.length - MAX_COOKIE_ENTRIES);
  for (let i = 0; i < overflow; i++) {
    delete views[entries[i][0]];
  }

  response.cookies.set(VIEW_COOKIE, encodeURIComponent(JSON.stringify(views)), {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.ceil(VIEW_TTL_MS / 1000),
  });
}

function getBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const now = Date.now();

  const views = readViewCookie(request);
  const lastViewed = views[id];
  if (lastViewed && now - lastViewed < VIEW_TTL_MS) {
    return NextResponse.json({ ok: true, counted: false });
  }

  const supabase = getSupabaseAdmin();

  const { data: vacancy, error: fetchError } = await supabase
    .from("employer_vacancies")
    .select("id, user_id, status, is_active, views_count")
    .eq("id", id)
    .single();

  if (fetchError || !vacancy) {
    return NextResponse.json({ detail: "Вакансия не найдена" }, { status: 404 });
  }

  const token = getBearerToken(request);
  if (token) {
    const { data } = await supabase.auth.getUser(token);
    if (data.user?.id && data.user.id === vacancy.user_id) {
      return NextResponse.json({ ok: true, counted: false });
    }
  }

  const isPublished = vacancy.status === "published" && vacancy.is_active;
  if (!isPublished) {
    return NextResponse.json({ detail: "Вакансия не найдена" }, { status: 404 });
  }

  const nextCount = (vacancy.views_count || 0) + 1;
  const { error: updateError } = await supabase
    .from("employer_vacancies")
    .update({ views_count: nextCount })
    .eq("id", id);

  if (updateError) {
    console.error("[VacancyView] Update error:", updateError);
    return NextResponse.json({ detail: "Ошибка обновления просмотров" }, { status: 500 });
  }

  views[id] = now;
  const response = NextResponse.json({ ok: true, counted: true, views_count: nextCount });
  writeViewCookie(response, views);
  return response;
}


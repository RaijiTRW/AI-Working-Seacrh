import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

async function checkIsAdmin(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.slice(7);
  const supabase = getSupabaseAdmin();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) {
    return false;
  }

  // Check admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  return profile?.role === "admin";
}

// GET /api/admin/employer-vacancies - Получить вакансии на модерации
export async function GET(request: NextRequest) {
  const isAdmin = await checkIsAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ detail: "Access denied" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "pending_review"; // pending_review, rejected
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  const supabase = getSupabaseAdmin();

  // Get vacancies
  const { data, error, count } = await supabase
    .from("employer_vacancies")
    .select("*", { count: "exact" })
    .eq("status", status)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 400 });
  }

  // Get profiles for user info
  const vacancies = data || [];
  const userIds = [...new Set(vacancies.map((v: { user_id: string }) => v.user_id))];

  let profilesMap: Record<string, { first_name: string; last_name: string }> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_name")
      .in("user_id", userIds);

    if (profiles) {
      for (const p of profiles) {
        profilesMap[p.user_id] = p;
      }
    }
  }

  // Attach profile info
  const vacanciesWithProfiles = vacancies.map((v: { user_id: string; contact_email?: string }) => ({
    ...v,
    profiles: profilesMap[v.user_id]
      ? {
          full_name: [profilesMap[v.user_id].first_name, profilesMap[v.user_id].last_name]
            .filter(Boolean)
            .join(" ") || "Без имени",
          email: v.contact_email || "",
        }
      : { full_name: "Без имени", email: v.contact_email || "" },
  }));

  const total = count || 0;
  const pages = Math.ceil(total / limit);

  return NextResponse.json({
    vacancies: vacanciesWithProfiles,
    total,
    page,
    pages,
    has_next: page < pages,
  });
}

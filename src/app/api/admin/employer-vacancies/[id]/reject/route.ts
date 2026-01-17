import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

async function getAdminUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  const supabase = getSupabaseAdmin();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) {
    return null;
  }

  // Check admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return null;
  }

  return user.id;
}

// POST /api/admin/employer-vacancies/[id]/reject - Отклонить вакансию вручную
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const adminId = await getAdminUserId(request);

  if (!adminId) {
    return NextResponse.json({ detail: "Access denied" }, { status: 403 });
  }

  const body = await request.json();
  const reason = body.reason || "Отклонено администратором";

  const supabase = getSupabaseAdmin();

  // Reject the vacancy
  const { data, error } = await supabase
    .from("employer_vacancies")
    .update({
      status: "rejected",
      is_active: false,
      rejection_reason: reason,
      moderation_checked_at: new Date().toISOString(),
      moderated_by: adminId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

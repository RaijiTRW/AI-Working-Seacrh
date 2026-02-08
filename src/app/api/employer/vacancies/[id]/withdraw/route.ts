import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

async function getUserFromToken(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  const supabase = getSupabaseAdmin();

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return null;
  }

  return user.id;
}

// POST /api/employer/vacancies/[id]/withdraw - Withdraw from moderation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await getUserFromToken(request);

  if (!userId) {
    return NextResponse.json(
      { detail: "Unauthorized" },
      { status: 401 }
    );
  }

  const supabase = getSupabaseAdmin();

  // Check ownership
  const { data: existing, error: fetchError } = await supabase
    .from("employer_vacancies")
    .select("user_id, status")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(
      { detail: "Vacancy not found" },
      { status: 404 }
    );
  }

  if (existing.user_id !== userId) {
    return NextResponse.json(
      { detail: "Access denied" },
      { status: 403 }
    );
  }

  // Only allow withdrawing from pending_review
  if (existing.status !== "pending_review") {
    return NextResponse.json(
      { detail: "Can only withdraw vacancies that are on moderation" },
      { status: 400 }
    );
  }

  // Withdraw - change back to draft
  const { data, error } = await supabase
    .from("employer_vacancies")
    .update({
      status: "draft",
      is_active: false,
      rejection_reason: null,
      moderation_checked_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { detail: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ...data,
    message: "Вакансия отозвана с модерации"
  });
}

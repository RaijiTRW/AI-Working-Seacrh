import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

// POST /api/employer/vacancies/[id]/view - Increment view count
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  // Get current vacancy
  const { data: vacancy, error: fetchError } = await supabase
    .from("employer_vacancies")
    .select("views_count")
    .eq("id", id)
    .single();

  if (fetchError || !vacancy) {
    return NextResponse.json(
      { detail: "Vacancy not found" },
      { status: 404 }
    );
  }

  // Increment view count
  const { error } = await supabase
    .from("employer_vacancies")
    .update({
      views_count: (vacancy.views_count || 0) + 1
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { detail: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    views_count: (vacancy.views_count || 0) + 1
  });
}

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

// GET /api/employer/vacancies/[id] - Get vacancy by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("employer_vacancies")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { detail: "Vacancy not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}

// PUT /api/employer/vacancies/[id] - Update vacancy
export async function PUT(
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
    .select("user_id")
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

  const body = await request.json();

  // Filter allowed fields
  const allowedFields = [
    "title", "company", "city", "salary_from", "salary_to",
    "salary_currency", "experience", "employment_type", "schedule",
    "description", "requirements", "conditions",
    "contact_name", "contact_email", "contact_phone"
  ];

  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field];
    }
  }
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("employer_vacancies")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { detail: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json(data);
}

// DELETE /api/employer/vacancies/[id] - Delete vacancy
export async function DELETE(
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
    .select("user_id")
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

  const { error } = await supabase
    .from("employer_vacancies")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { detail: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}

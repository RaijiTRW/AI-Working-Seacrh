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

// GET /api/employer/vacancies - List my vacancies
export async function GET(request: NextRequest) {
  const userId = await getUserFromToken(request);

  if (!userId) {
    return NextResponse.json(
      { detail: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  const supabase = getSupabaseAdmin();

  // Get total count
  const { count } = await supabase
    .from("employer_vacancies")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  // Get vacancies
  const { data, error } = await supabase
    .from("employer_vacancies")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json(
      { detail: error.message },
      { status: 400 }
    );
  }

  const total = count || 0;
  const pages = Math.ceil(total / limit);

  return NextResponse.json({
    vacancies: data || [],
    total,
    page,
    pages,
    has_next: page < pages,
  });
}

// POST /api/employer/vacancies - Create vacancy
export async function POST(request: NextRequest) {
  const userId = await getUserFromToken(request);

  if (!userId) {
    return NextResponse.json(
      { detail: "Unauthorized" },
      { status: 401 }
    );
  }

  const supabase = getSupabaseAdmin();

  // Check if user is banned from creating vacancies
  const { data: profile } = await supabase
    .from("profiles")
    .select("can_create_vacancies, vacancy_ban_reason")
    .eq("user_id", userId)
    .single();

  if (profile && profile.can_create_vacancies === false) {
    return NextResponse.json(
      {
        detail: "Вам запрещено создавать вакансии",
        vacancy_banned: true,
        ban_reason: profile.vacancy_ban_reason || "Нарушение правил публикации",
      },
      { status: 403 }
    );
  }

  const body = await request.json();

  // Validate required fields
  if (!body.title || body.title.length < 3) {
    return NextResponse.json(
      { detail: "Title must be at least 3 characters" },
      { status: 400 }
    );
  }
  if (!body.company) {
    return NextResponse.json(
      { detail: "Company is required" },
      { status: 400 }
    );
  }
  if (!body.city) {
    return NextResponse.json(
      { detail: "City is required" },
      { status: 400 }
    );
  }
  if (!body.description || body.description.length < 50) {
    return NextResponse.json(
      { detail: "Description must be at least 50 characters" },
      { status: 400 }
    );
  }

  const vacancyData = {
    user_id: userId,
    title: body.title,
    company: body.company,
    city: body.city,
    salary_from: body.salary_from || null,
    salary_to: body.salary_to || null,
    salary_currency: body.salary_currency || "RUB",
    experience: body.experience || null,
    employment_type: body.employment_type || null,
    schedule: body.schedule || null,
    description: body.description,
    requirements: body.requirements || null,
    conditions: body.conditions || null,
    contact_name: body.contact_name || null,
    contact_email: body.contact_email || null,
    contact_phone: body.contact_phone || null,
    status: "draft",
    is_active: false,
    views_count: 0,
    responses_count: 0,
  };

  const { data, error } = await supabase
    .from("employer_vacancies")
    .insert(vacancyData)
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

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

  // Validate basic required fields
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

  // Validate new structured offer fields (required)
  const salaryTypes = ['fix', 'range', 'bonuses', 'kpi'];
  if (body.salary_type && !salaryTypes.includes(body.salary_type)) {
    return NextResponse.json(
      { detail: "Invalid salary_type" },
      { status: 400 }
    );
  }

  const taxTypes = ['gross', 'net'];
  if (body.salary_tax_type && !taxTypes.includes(body.salary_tax_type)) {
    return NextResponse.json(
      { detail: "Invalid salary_tax_type" },
      { status: 400 }
    );
  }

  const salaryPeriods = ['month', 'week', 'day', 'hour', 'shift', 'project'];
  if (body.salary_period && !salaryPeriods.includes(body.salary_period)) {
    return NextResponse.json(
      { detail: "Invalid salary_period" },
      { status: 400 }
    );
  }

  const contractTypes = ['labor_rf', 'gph', 'ip', 'self_employed'];
  if (body.contract_type && !contractTypes.includes(body.contract_type)) {
    return NextResponse.json(
      { detail: "Invalid contract_type" },
      { status: 400 }
    );
  }

  const workFormats = ['office', 'remote', 'hybrid'];
  if (body.work_format && !workFormats.includes(body.work_format)) {
    return NextResponse.json(
      { detail: "Invalid work_format" },
      { status: 400 }
    );
  }

  const overtimePolicies = ['paid', 'unpaid', 'negotiable'];
  if (body.overtime_policy && !overtimePolicies.includes(body.overtime_policy)) {
    return NextResponse.json(
      { detail: "Invalid overtime_policy" },
      { status: 400 }
    );
  }

  // Validate optional numeric fields
  if (body.probation_months !== undefined && (body.probation_months < 0 || body.probation_months > 12)) {
    return NextResponse.json(
      { detail: "probation_months must be between 0 and 12" },
      { status: 400 }
    );
  }

  if (body.probation_salary_reduction !== undefined && (body.probation_salary_reduction < 0 || body.probation_salary_reduction > 50)) {
    return NextResponse.json(
      { detail: "probation_salary_reduction must be between 0 and 50" },
      { status: 400 }
    );
  }

  // Validate JSONB fields
  if (body.salary_bonuses && typeof body.salary_bonuses !== 'object') {
    return NextResponse.json(
      { detail: "salary_bonuses must be an object" },
      { status: 400 }
    );
  }

  if (body.salary_kpi && typeof body.salary_kpi !== 'object') {
    return NextResponse.json(
      { detail: "salary_kpi must be an object" },
      { status: 400 }
    );
  }

  if (body.work_hours && typeof body.work_hours !== 'object') {
    return NextResponse.json(
      { detail: "work_hours must be an object" },
      { status: 400 }
    );
  }

  if (body.responsibilities && !Array.isArray(body.responsibilities)) {
    return NextResponse.json(
      { detail: "responsibilities must be an array" },
      { status: 400 }
    );
  }

  if (body.tech_stack && !Array.isArray(body.tech_stack)) {
    return NextResponse.json(
      { detail: "tech_stack must be an array" },
      { status: 400 }
    );
  }

  const vacancyData = {
    user_id: userId,
    title: body.title,
    company: body.company,
    city: body.city,
    // Старые поля зарплаты (для обратной совместимости)
    salary_from: body.salary_from || null,
    salary_to: body.salary_to || null,
    salary_currency: body.salary_currency || "RUB",
    // Новые поля зарплаты
    salary_type: body.salary_type || "range",
    salary_tax_type: body.salary_tax_type || "net",
    salary_period: body.salary_period || "month",
    salary_bonuses: body.salary_bonuses || { enabled: false },
    salary_kpi: body.salary_kpi || { enabled: false },
    // Старые поля условий (для обратной совместимости)
    experience: body.experience || null,
    employment_type: body.employment_type || null,
    schedule: body.schedule || null,
    // Новые поля условий
    contract_type: body.contract_type || "labor_rf",
    contract_comment: body.contract_comment || null,
    work_format: body.work_format || "office",
    work_hours: body.work_hours || { hours: 8, type: "per_day" },
    overtime_policy: body.overtime_policy || "unpaid",
    probation_months: body.probation_months ?? 3,
    probation_salary_reduction: body.probation_salary_reduction ?? 0,
    // Новые структурированные поля
    responsibilities: body.responsibilities || [],
    tech_stack: body.tech_stack || [],
    grade_level: body.grade_level || null,
    // Старые текстовые поля (для обратной совместимости)
    description: body.description,
    requirements: body.requirements || null,
    conditions: body.conditions || null,
    // Контакты
    contact_name: body.contact_name || null,
    contact_email: body.contact_email || null,
    contact_phone: body.contact_phone || null,
    // Метаданные
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

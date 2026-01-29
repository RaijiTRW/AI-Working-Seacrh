import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

// GET /api/vacancies/[id] - Публичный endpoint для получения вакансии по ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = getSupabaseAdmin();

  try {
    // Проверяем авторизацию через Authorization header
    const authHeader = request.headers.get("authorization");
    let currentUserId: string | null = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      currentUserId = user?.id || null;
    }

    // Ищем вакансию в employer_vacancies
    let query = supabase
      .from("employer_vacancies")
      .select("*")
      .eq("id", id);

    // Если пользователь не авторизован как владелец, показываем только опубликованные вакансии
    if (!currentUserId) {
      query = query.eq("status", "published").eq("is_active", true);
    }

    const { data: vacancy, error } = await query.single();

    if (error || !vacancy) {
      return NextResponse.json(
        { detail: "Вакансия не найдена" },
        { status: 404 }
      );
    }

    // Проверяем доступ: либо опубликованная вакансия, либо владелец
    const isOwner = currentUserId === vacancy.user_id;
    const isPublished = vacancy.status === "published" && vacancy.is_active;

    if (!isOwner && !isPublished) {
      return NextResponse.json(
        { detail: "Вакансия не найдена" },
        { status: 404 }
      );
    }

    // Форматируем ответ
    const formattedVacancy = {
      id: vacancy.id,
      user_id: vacancy.user_id,
      title: vacancy.title,
      company: vacancy.company,
      city: vacancy.city,
      // Зарплата
      salary_from: vacancy.salary_from,
      salary_to: vacancy.salary_to,
      salary_currency: vacancy.salary_currency,
      salary_type: vacancy.salary_type,
      salary_tax_type: vacancy.salary_tax_type,
      salary_period: vacancy.salary_period,
      salary_bonuses: vacancy.salary_bonuses,
      salary_kpi: vacancy.salary_kpi,
      // Условия
      experience: vacancy.experience,
      employment_type: vacancy.employment_type,
      schedule: vacancy.schedule,
      contract_type: vacancy.contract_type,
      contract_comment: vacancy.contract_comment,
      work_format: vacancy.work_format,
      work_hours: vacancy.work_hours,
      overtime_policy: vacancy.overtime_policy,
      probation_months: vacancy.probation_months,
      probation_salary_reduction: vacancy.probation_salary_reduction,
      // Структурированные поля
      responsibilities: vacancy.responsibilities,
      tech_stack: vacancy.tech_stack,
      grade_level: vacancy.grade_level,
      // Описание
      description: vacancy.description,
      requirements: vacancy.requirements,
      conditions: vacancy.conditions,
      // Контакты
      contact_name: vacancy.contact_name,
      contact_email: vacancy.contact_email,
      contact_phone: vacancy.contact_phone,
      // Метаданные
      status: vacancy.status,
      is_active: vacancy.is_active,
      views_count: vacancy.views_count || 0,
      responses_count: vacancy.responses_count || 0,
      created_at: vacancy.created_at,
      updated_at: vacancy.updated_at,
      published_at: vacancy.published_at,
    };

    return NextResponse.json(formattedVacancy);
  } catch (error) {
    console.error("[VacancyDetail] Error:", error);
    return NextResponse.json(
      { detail: "Ошибка при получении вакансии" },
      { status: 500 }
    );
  }
}

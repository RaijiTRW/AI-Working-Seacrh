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

// POST /api/employer/vacancies/[id]/publish - Publish vacancy
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

  // Получаем полные данные вакансии для модерации
  const { data: vacancy, error: vacancyError } = await supabase
    .from("employer_vacancies")
    .select("*")
    .eq("id", id)
    .single();

  if (vacancyError || !vacancy) {
    return NextResponse.json(
      { detail: "Vacancy not found" },
      { status: 404 }
    );
  }

  // Отправляем на модерацию в Python backend
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  try {
    const moderationResponse = await fetch(`${backendUrl}/api/employer/vacancies/${id}/moderate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: vacancy.title,
        company: vacancy.company,
        description: vacancy.description,
        requirements: vacancy.requirements,
        conditions: vacancy.conditions,
      }),
    });

    const moderationResult = await moderationResponse.json();

    if (moderationResult.approved) {
      // AI одобрил - публикуем
      const { data, error } = await supabase
        .from("employer_vacancies")
        .update({
          status: "published",
          is_active: true,
          published_at: new Date().toISOString(),
          moderation_checked_at: new Date().toISOString(),
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

      return NextResponse.json(data);
    } else {
      // AI отклонил - ставим в rejected с причиной
      const { data, error } = await supabase
        .from("employer_vacancies")
        .update({
          status: "rejected",
          is_active: false,
          rejection_reason: moderationResult.reason,
          moderation_checked_at: new Date().toISOString(),
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

      return NextResponse.json(
        {
          ...data,
          moderation_status: "rejected",
          rejection_reason: moderationResult.reason
        },
        { status: 200 }
      );
    }
  } catch (moderationError) {
    console.error("Moderation error:", moderationError);

    // При ошибке модерации - ставим pending_review для ручной проверки админом
    const { data, error } = await supabase
      .from("employer_vacancies")
      .update({
        status: "pending_review",
        is_active: false,
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
      moderation_status: "pending_review",
      message: "Вакансия отправлена на модерацию администратору"
    });
  }
}

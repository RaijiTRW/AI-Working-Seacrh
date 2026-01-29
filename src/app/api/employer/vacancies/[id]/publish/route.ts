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

  // Всегда ставим pending_review — админ одобряет вручную
  // AI модерация даёт рекомендацию (ai_approved/ai_rejection_reason), но не публикует
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  let aiApproved: boolean | null = null;
  let aiReason: string | null = null;

  // AI-модерация с timeout (5 секунд)
  if (backendUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 сек timeout

      const moderationResponse = await fetch(`${backendUrl}/api/employer/vacancies/${id}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: vacancy.title,
          company: vacancy.company,
          description: vacancy.description,
          requirements: vacancy.requirements,
          conditions: vacancy.conditions,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (moderationResponse.ok) {
        const moderationResult = await moderationResponse.json();
        aiApproved = moderationResult.approved;
        aiReason = moderationResult.reason || null;
      }
    } catch (moderationError) {
      console.error("AI moderation error or timeout:", moderationError);
      // Продолжаем без AI-модерации
    }
  }

  // Ставим на модерацию админу
  const updateData: Record<string, unknown> = {
    status: "pending_review",
    is_active: false,
    moderation_checked_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Если AI отклонил — сохраняем причину как подсказку для админа
  if (aiApproved === false && aiReason) {
    updateData.rejection_reason = `[AI] ${aiReason}`;
  }

  const { data, error } = await supabase
    .from("employer_vacancies")
    .update(updateData)
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
    message: "Вакансия отправлена на модерацию"
  });
}

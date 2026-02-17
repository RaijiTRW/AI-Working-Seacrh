import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromToken } from "@/lib/supabase-admin";
import { Resume } from "@/types/resume";

// GET /api/resume - Получить резюме пользователя
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("resumes")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      // Резюме не найдено - возвращаем null, клиент создаст новое
      return NextResponse.json({ resume: null });
    }

    // Преобразуем данные БД в формат Resume
    const resume: Resume = {
      id: data.id,
      user_id: data.user_id,
      guest_id: data.guest_id,
      personal_info: data.personal_info || {},
      contacts: data.contacts || {},
      desired_position: data.desired_position || "",
      desired_salary: data.desired_salary || "",
      experience: data.work_experience || [],
      education: data.education || [],
      skills: data.skills || "",
      languages: data.languages || [],
      achievements: data.achievements || [],
      about: data.about || "",
      template_id: data.template_id || "modern",
      ats_score: data.ats_score,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    return NextResponse.json({ resume });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/resume - Создать или обновить резюме
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { resume_data, resume_id } = body as { resume_data?: Partial<Resume>; resume_id?: string };

    if (!resume_data) {
      return NextResponse.json({ error: "Missing resume_data" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    // Подготовка данных для вставки/обновления
    const dbData = {
      user_id: userId,
      personal_info: resume_data.personal_info || {},
      contacts: resume_data.contacts || {},
      desired_position: resume_data.desired_position || "",
      desired_salary: resume_data.desired_salary || "",
      work_experience: resume_data.experience || [],
      education: resume_data.education || [],
      skills: resume_data.skills || "",
      languages: resume_data.languages || [],
      achievements: resume_data.achievements || [],
      about: resume_data.about || "",
      template_id: resume_data.template_id || "modern",
      ats_score: resume_data.ats_score,
      updated_at: now,
    };

    let result;

    if (resume_id) {
      // Обновление существующего резюме
      const { data, error } = await supabase
        .from("resumes")
        .update(dbData)
        .eq("id", resume_id)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      result = data;
    } else {
      // Проверяем, существует ли уже резюме для пользователя
      const { data: existing } = await supabase
        .from("resumes")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        // Обновляем существующее
        const { data, error } = await supabase
          .from("resumes")
          .update(dbData)
          .eq("id", existing.id)
          .select()
          .single();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        result = data;
      } else {
        // Создаем новое
        const { data, error } = await supabase
          .from("resumes")
          .insert({ ...dbData, created_at: now })
          .select()
          .single();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        result = data;
      }
    }

    // Преобразуем ответ в формат Resume
    const resume: Resume = {
      id: result.id,
      user_id: result.user_id,
      guest_id: result.guest_id,
      personal_info: result.personal_info || {},
      contacts: result.contacts || {},
      desired_position: result.desired_position || "",
      desired_salary: result.desired_salary || "",
      experience: result.work_experience || [],
      education: result.education || [],
      skills: result.skills || "",
      languages: result.languages || [],
      achievements: result.achievements || [],
      about: result.about || "",
      template_id: result.template_id || "modern",
      ats_score: result.ats_score,
      created_at: result.created_at,
      updated_at: result.updated_at,
    };

    // Синхронизируем личные данные с таблицей profiles
    try {
      const profileData: any = {
        user_id: userId,
        updated_at: now,
      };

      // Извлекаем данные из резюме для синхронизации с профилем
      if (resume_data.personal_info) {
        if (resume_data.personal_info.first_name) profileData.first_name = resume_data.personal_info.first_name;
        if (resume_data.personal_info.last_name) profileData.last_name = resume_data.personal_info.last_name;
        if (resume_data.personal_info.middle_name) profileData.patronymic = resume_data.personal_info.middle_name;
        if (resume_data.personal_info.birth_date) profileData.birth_date = resume_data.personal_info.birth_date;
      }

      if (resume_data.contacts) {
        if (resume_data.contacts.phone) profileData.phone = resume_data.contacts.phone;
        if (resume_data.contacts.city) profileData.city = resume_data.contacts.city;
      }

      // Upsert в таблицу profiles
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(profileData, { onConflict: "user_id" });

      if (profileError) {
        // Не прерываем операцию
      }
    } catch (syncError) {
      // Не прерываем операцию
    }

    return NextResponse.json({ resume, resume_id: result.id });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/resume - Удалить резюме пользователя
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resumeId = searchParams.get("resume_id");

    if (!resumeId) {
      return NextResponse.json({ error: "Missing resume_id" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from("resumes")
      .delete()
      .eq("id", resumeId)
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

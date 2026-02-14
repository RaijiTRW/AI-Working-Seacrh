import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { Resume } from "@/types/resume";

// AI API configuration
const AI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
const AI_API_URL = process.env.AI_API_URL || "https://openrouter.ai/api/v1/chat/completions";
const AI_MODEL = process.env.AI_MODEL || "google/gemini-2.0-flash-exp:free";

interface GenerateRequest {
  prompt: string;
  user_id: string;
  current_resume?: Resume;
}

interface GenerateResponse {
  resume: Partial<Resume>;
  message: string;
}

// Check AI access (Pro subscription)
async function checkAIAccess(userId: string): Promise<boolean> {
  const supabase = await createServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, is_pro_trial, pro_trial_until")
    .eq("id", userId)
    .single();

  if (!profile) return false;

  if (profile.plan === "pro") return true;
  if (profile.is_pro_trial && profile.pro_trial_until) {
    const trialEnd = new Date(profile.pro_trial_until);
    if (trialEnd > new Date()) return true;
  }

  return false;
}

function getResumeGenerationPrompt(userPrompt: string, currentResume?: Resume): string {
  let prompt = `Ты - эксперт по написанию резюме для российского рынка труда.
Создай полноценное резюме на основе описания пользователя.

ВАЖНО:
- Пиши на русском языке
- Используй профессиональную лексику без клише
- Создай реалистичный опыт на основе описания
- Добавь конкретные метрики и достижения
- Структурируй для ATS-систем
- Если данных нет - используй реалистичные placeholders

Описание пользователя: "${userPrompt}"
`;

  if (currentResume) {
    prompt += `\nТекущее резюме (для улучшения или дополнения):\n${JSON.stringify(currentResume, null, 2)}\n`;
  }

  prompt += `
Верни ответ в формате JSON:
{
  "personal_info": {
    "first_name": "Имя",
    "last_name": "Фамилия",
    "middle_name": "Отчество (если есть)",
    "gender": "male или female или null"
  },
  "contacts": {
    "email": "email@example.com",
    "phone": "+7 (999) 123-45-67",
    "city": "Город",
    "telegram": "@username (опционально)",
    "linkedin": "ссылка (опционально)",
    "github": "ссылка (опционально)",
    "portfolio": "ссылка (опционально)",
    "ready_to_relocate": false,
    "employment_type": ["full", "remote"]
  },
  "desired_position": "Желаемая должность",
  "desired_salary": "Зарплата (опционально)",
  "experience": [
    {
      "id": "uuid-1",
      "company": "Компания",
      "position": "Должность",
      "start_date": "2021-01",
      "end_date": "2024-01",
      "is_current": false,
      "description": "Описание с достижениями и метриками"
    }
  ],
  "education": [
    {
      "id": "uuid-2",
      "institution": "Учебное заведение",
      "degree": "bachelor или другой уровень",
      "field": "Специальность",
      "start_year": "2017",
      "end_year": "2021"
    }
  ],
  "skills": "Навыки через запятую, сгруппированные по категориям",
  "languages": [
    {
      "id": "uuid-3",
      "language": "Английский",
      "level": "B2"
    }
  ],
  "achievements": [
    {
      "id": "uuid-4",
      "title": "Достижение",
      "description": "Описание с результатами",
      "date": "2024-01"
    }
  ],
  "about": "Профессиональное самопозиционирование (2-3 предложения, 200-500 символов)",
  "template_id": "modern"
}

Примечания:
- Генерируй уникальные UUID для id полей
- Если в описании нет имени, используй placeholders типа "Иван", "Мария"
- Добавь 2-4 записи опыта работы (или 1-2 еслиJunior)
- Добавь 1-2 записи образования
- Создай 2-3 достижения с метриками (если уместно)
- Варианты employment_type: "full", "part", "contract", "temporary", "internship", "project", "volunteer", "remote"
- Варианты образования: "secondary", "vocational", "incomplete_higher", "bachelor", "specialist", "master", "phd"
- Варианты языков: "A1", "A2", "B1", "B2", "C1", "C2", "native"
`;

  return prompt;
}

function validateInput(prompt: string): { valid: boolean; error?: string } {
  if (!prompt || prompt.trim().length < 20) {
    return { valid: false, error: "Описание слишком короткое (минимум 20 символов)" };
  }

  if (prompt.length > 2000) {
    return { valid: false, error: "Описание слишком длинное (максимум 2000 символов)" };
  }

  return { valid: true };
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateRequest = await req.json();
    const { prompt, user_id, current_resume } = body;

    // Validation
    const validation = validateInput(prompt);
    if (!validation.valid) {
      return NextResponse.json({ detail: validation.error }, { status: 400 });
    }

    // Check limit (5 generations max for free users, unlimited for Pro)
    const supabase = await createServerClient();

    // Check if user has Pro subscription
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, is_pro_trial, pro_trial_until")
      .eq("id", user_id)
      .single();

    const isPro = profile?.plan === "pro";
    const isProTrial = profile?.is_pro_trial &&
      profile?.pro_trial_until &&
      new Date(profile.pro_trial_until) > new Date();
    const hasUnlimitedAccess = isPro || isProTrial;

    // Only check limit for free users
    if (!hasUnlimitedAccess) {
      const { data: logs, error: countError } = await supabase
        .from("ai_usage_logs")
        .select("id")
        .eq("user_id", user_id)
        .eq("field", "resume_generate");

      if (countError) {
        console.error("Count error:", countError);
        return NextResponse.json(
          { detail: "Ошибка при проверке лимита" },
          { status: 500 }
        );
      }

      const usedCount = logs?.length || 0;
      const MAX_GENERATIONS = 5;

      if (usedCount >= MAX_GENERATIONS) {
        return NextResponse.json(
          { detail: `Исчерпан лимит генераций резюме (максимум ${MAX_GENERATIONS}). Оформите Pro подписку для безлимитного доступа.` },
          { status: 429 }
        );
      }
    }

    // Check API key
    if (!AI_API_KEY) {
      return NextResponse.json(
        { detail: "AI сервис не настроен" },
        { status: 500 }
      );
    }

    // Call AI API
    const userPrompt = getResumeGenerationPrompt(prompt, current_resume);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${AI_API_KEY}`,
    };

    if (AI_API_URL.includes("openrouter")) {
      headers["HTTP-Referer"] = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      headers["X-Title"] = "JobSeacrh Resume Generator";
    }

    const response = await fetch(AI_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: "system", content: "Ты - эксперт по резюме для российского рынка. Отвечай только валидным JSON без markdown." },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      console.error("AI API error:", await response.text());
      return NextResponse.json(
        { detail: "Ошибка AI сервиса. Попробуйте позже." },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { detail: "Пустой ответ от AI" },
        { status: 500 }
      );
    }

    // Parse JSON response
    let resumeData: Partial<Resume>;
    try {
      // Extract JSON from markdown code blocks if present
      let jsonContent = content;
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```([\s\S]*?)```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1];
      }
      resumeData = JSON.parse(jsonContent);
    } catch (e) {
      console.error("JSON parse error:", e);
      console.error("Content:", content);
      return NextResponse.json(
        { detail: "Не удалось распарсить ответ AI. Попробуйте снова." },
        { status: 500 }
      );
    }

    // Log usage
    supabase.from("ai_usage_logs").insert({
      user_id,
      field: "resume_generate",
      text_length: prompt.length,
      improved_length: JSON.stringify(resumeData).length,
    }).then(() => {}, (err) => console.error("Failed to log AI usage:", err));

    const responseData: GenerateResponse = {
      resume: resumeData,
      message: "Резюме успешно сгенерировано! Проверьте и отредактируйте поля при необходимости.",
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error("AI generate error:", error);
    return NextResponse.json(
      { detail: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { AIImproveResponse } from "@/types/resume";

// AI API configuration (поддерживает OpenAI и Open Router)
const AI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
const AI_API_URL = process.env.AI_API_URL || "https://openrouter.ai/api/v1/chat/completions";
const AI_MODEL = process.env.AI_MODEL || "google/gemini-2.0-flash-exp:free";

interface ImproveRequest {
  text: string;
  field: "about" | "experience_description" | "skills" | "achievements";
  user_id: string;
  context?: string;
}

// Проверка доступа к AI (Pro подписка)
async function checkAIAccess(userId: string): Promise<boolean> {
  const supabase = await createServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, is_pro_trial, pro_trial_until")
    .eq("id", userId)
    .single();

  if (!profile) return false;

  // Pro или пробный Pro
  if (profile.plan === "pro") return true;
  if (profile.is_pro_trial && profile.pro_trial_until) {
    const trialEnd = new Date(profile.pro_trial_until);
    if (trialEnd > new Date()) return true;
  }

  return false;
}

// Промпты для разных типов полей
function getSystemPrompt(field: string): string {
  const basePrompt = `Ты - эксперт по написанию резюме для российского рынка труда.
Твоя задача - улучшить текст, сделав его более профессиональным и эффективным.

ВАЖНО:
- Пиши на русском языке
- Используй профессиональную лексику, но без клише
- Добавляй конкретику и метрики там, где это уместно
- Сохраняй правдивость - не выдумывай факты
- Структурируй текст для ATS-систем
- Максимальная длина ответа: 500 символов
`;

  const fieldPrompts: Record<string, string> = {
    about: `${basePrompt}
Для раздела "О себе":
- Начни с профессионального самопозиционирования
- Добавь 2-3 ключевых достижения с цифрами
- Упомяни основные навыки
- Закончи целями или ценностями`,

    experience_description: `${basePrompt}
Для описания опыта работы:
- Используй глаголы действия: разработал, внедрил, увеличил, оптимизировал
- Добавь конкретные результаты и метрики
- Структурируй по пунктам если возможно
- Покажи масштаб работы`,

    skills: `${basePrompt}
Для раздела "Навыки":
- Группируй по категориям
- Используй общепринятые названия
- Добавь уровень владения если уместно
- Включи актуальные технологии`,

    achievements: `${basePrompt}
Для раздела "Достижения":
- Формат: что сделал → каким результат → в каких цифрах
- Используй конкретные метрики
- Покажи бизнес-impact
- Выдели 2-3 самых значимых`
  };

  return fieldPrompts[field] || basePrompt;
}

function getUserPrompt(text: string, field: string, context?: string): string {
  let prompt = `Улучшить следующий текст для резюме:\n\n"${text}"`;

  if (context) {
    prompt += `\n\nКонтекст: ${context}`;
  }

  prompt += `\n\nВерни ответ в формате JSON:
{
  "improved_text": "улучшенный текст",
  "suggestions": ["совет 1", "совет 2", "совет 3"],
  "ats_keywords": ["ключевое слово 1", "ключевое слово 2"]
}`;

  return prompt;
}

// Валидация входных данных
function validateInput(text: string, field: string): { valid: boolean; error?: string } {
  if (!text || text.trim().length < 10) {
    return { valid: false, error: "Текст слишком короткий (минимум 10 символов)" };
  }

  if (text.length > 5000) {
    return { valid: false, error: "Текст слишком длинный (максимум 5000 символов)" };
  }

  // Проверка на спам
  const repeatedChars = /(.)\1{10,}/;
  if (repeatedChars.test(text)) {
    return { valid: false, error: "Текст содержит подозрительные паттерны" };
  }

  const validFields = ["about", "experience_description", "skills", "achievements"];
  if (!validFields.includes(field)) {
    return { valid: false, error: "Некорректный тип поля" };
  }

  return { valid: true };
}

export async function POST(req: NextRequest) {
  try {
    // Парсинг запроса
    const body: ImproveRequest = await req.json();
    const { text, field, user_id, context } = body;

    // Валидация
    const validation = validateInput(text, field);
    if (!validation.valid) {
      return NextResponse.json(
        { detail: validation.error },
        { status: 400 }
      );
    }

    // Проверка доступа к AI (с лимитом 5 для бесплатных пользователей)
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
        .eq("user_id", user_id);

      if (countError) {
        return NextResponse.json(
          { detail: "Ошибка при проверке лимита" },
          { status: 500 }
        );
      }

      const usedCount = logs?.length || 0;
      const MAX_AI_REQUESTS = 5;

      if (usedCount >= MAX_AI_REQUESTS) {
        return NextResponse.json(
          { detail: `Исчерпан лимит AI запросов (максимум ${MAX_AI_REQUESTS}). Оформите Pro подписку для безлимитного доступа.` },
          { status: 429 }
        );
      }
    }

    // Проверка API ключа
    if (!AI_API_KEY) {
      return NextResponse.json(
        { detail: "AI сервис не настроен. Обратитесь к администратору." },
        { status: 500 }
      );
    }

    // Вызов AI API (OpenRouter/OpenAI)
    const systemPrompt = getSystemPrompt(field);
    const userPrompt = getUserPrompt(text, field, context);

    // Заголовки для OpenRouter
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${AI_API_KEY}`,
    };

    // Добавляем заголовки для OpenRouter (best practices)
    if (AI_API_URL.includes("openrouter")) {
      headers["HTTP-Referer"] = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      headers["X-Title"] = "JobSeacrh Resume Builder";
    }

    const response = await fetch(AI_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 800,
        // response_format не поддерживается всеми моделями, убираем для совместимости
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { detail: "Ошибка AI сервиса. Попробуйте позже." },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { detail: "Пустой ответ от AI сервиса" },
        { status: 500 }
      );
    }

    // Парсинг ответа
    let aiResponse: AIImproveResponse;
    try {
      aiResponse = JSON.parse(content);
    } catch (e) {
      // Если не смогли распарсить JSON, создаем базовый ответ
      aiResponse = {
        improved_text: content,
        suggestions: [],
        ats_keywords: [],
      };
    }

    // Логирование использования
    // Логирование в фоне, без ожидания завершения
    supabase.from("ai_usage_logs").insert({
      user_id,
      field,
      text_length: text.length,
      improved_length: aiResponse.improved_text.length,
    }).then(() => {}, (err) => {});

    return NextResponse.json(aiResponse);

  } catch (error) {
    return NextResponse.json(
      {
        detail: "Внутренняя ошибка сервера",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

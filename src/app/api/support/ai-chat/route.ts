import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/supabase-admin";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL_NAME = process.env.MODEL_NAME || "anthropic/claude-sonnet-4-5-20250514";

// Ключевые слова для определения запроса к администратору
const ADMIN_KEYWORDS = [
  "человек",
  "живой",
  "оператор",
  "администратор",
  "админ",
  "поддержка",
  "связаться",
  "позвонить",
  "менеджер",
  "консультант",
  "помощь живого",
  "реальный человек",
  "не бот",
  "хочу поговорить",
  "нужна помощь человека",
  "соединить с",
  "переключить на",
  "написать админу",
  "жалоба",
  "проблема с оплатой",
  "не работает оплата",
  "возврат денег",
  "отменить подписку",
];

function detectAdminRequest(message: string): boolean {
  const lowerMessage = message.toLowerCase();

  // Проверяем наличие ключевых слов
  for (const keyword of ADMIN_KEYWORDS) {
    if (lowerMessage.includes(keyword)) {
      return true;
    }
  }

  // Дополнительные паттерны
  const patterns = [
    /свяжи(те)?.*с.*человек/i,
    /хочу.*говорить.*с.*человек/i,
    /нужен.*живой/i,
    /перевед(и|ите).*на.*оператор/i,
    /можно.*поговорить.*с/i,
    /есть.*живой.*оператор/i,
    /как.*связаться.*с.*поддержк/i,
    /хочу.*пожаловаться/i,
    /вернуть.*деньги/i,
  ];

  for (const pattern of patterns) {
    if (pattern.test(lowerMessage)) {
      return true;
    }
  }

  return false;
}

async function callAI(message: string, needsAdmin: boolean): Promise<string> {
  try {
    const systemPrompt = needsAdmin
      ? `Ты дружелюбный помощник на сайте поиска работы JobAISearch.
Пользователь хочет связаться с живым администратором.
Скажи что понимаешь его и сейчас подключишь к администратору.
Будь вежлив и краток. Ответь на русском языке.`
      : `Ты дружелюбный помощник на сайте поиска работы JobAISearch.
Отвечай кратко и по делу на русском языке.
Помогай пользователям с вопросами о поиске работы, резюме и функциях сайта.

Основные функции сайта:
- AI-поиск вакансий через чат
- Лента вакансий с фильтрами
- Создание резюме в профиле
- Чат с работодателями
- Подписка Pro дает 10 запросов в день (799₽/мес), триал - 3 дня и 3 запроса в день

Если не можешь помочь с вопросом, предложи связаться с администратором.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices[0].message.content;
    } else {
      console.error("[AI Chat] Error:", response.status, await response.text());
      return needsAdmin
        ? "Подключаю вас к администратору..."
        : "Извините, произошла ошибка. Попробуйте позже.";
    }
  } catch (e) {
    console.error("[AI Chat] Exception:", e);
    return needsAdmin
      ? "Подключаю вас к администратору..."
      : "Извините, произошла ошибка. Попробуйте позже.";
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message } = await request.json();
    if (!message) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    // Определяем, хочет ли пользователь связаться с админом
    const connectToAdmin = detectAdminRequest(message);

    const response = await callAI(message, connectToAdmin);

    return NextResponse.json({
      response,
      connect_to_admin: connectToAdmin
    });
  } catch (e) {
    console.error("[AI Chat] Exception:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

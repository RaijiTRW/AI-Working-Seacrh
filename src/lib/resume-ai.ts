// AI функции для Resume Builder
// Используют Next.js API routes с OpenAI

import { AIImproveResponse } from "@/types/resume";

/**
 * Улучшает текст с помощью AI через Next.js API
 *
 * @param text - Исходный текст для улучшения
 * @param field - Тип поля (about, experience_description, skills, achievements)
 * @param userId - ID пользователя для проверки подписки
 * @param context - Опциональный контекст (например, название вакансии)
 * @returns Улучшенный текст и рекомендации
 */
export async function improveTextWithAI(
  text: string,
  field: "about" | "experience_description" | "skills" | "achievements",
  userId: string,
  context?: string
): Promise<AIImproveResponse> {
  try {
    const response = await fetch("/api/resume/ai-improve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        field,
        user_id: userId,
        context,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));

      if (response.status === 403) {
        throw new Error("AI функции доступны только на Pro подписке");
      }

      throw new Error(errorData.detail || "Ошибка при улучшении текста");
    }

    const data = await response.json();
    return data as AIImproveResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Не удалось подключиться к AI сервису");
  }
}

/**
 * Проверяет, имеет ли пользователь доступ к AI функциям
 *
 * AI функции доступны всем авторизованным пользователям с лимитом 5 генераций.
 * Pro пользователи имеют безлимитный доступ.
 *
 * @param _isPro - Прописка Pro (не используется, все пользователи имеют доступ)
 * @param _isProTrial - Пробный период Pro (не используется, все пользователи имеют доступ)
 * @returns true если пользователь авторизован (вызывается только для UI)
 * @deprecated Используйте прямую проверку isAuthenticated. Лимиты проверяются на сервере.
 */
export function hasAIAccess(_isPro?: boolean, _isProTrial?: boolean): boolean {
  // AI функции доступны всем авторизованным пользователям
  // Лимиты проверяются на сервере в API routes
  return true;
}

/**
 * Форматирует AI ответ для отображения пользователю
 *
 * @param response - Ответ от AI
 * @param originalText - Оригинальный текст
 * @returns Форматированный объект для UI
 */
export function formatAIResponse(
  response: AIImproveResponse,
  originalText: string
) {
  return {
    improvedText: response.improved_text,
    suggestions: response.suggestions || [],
    atsKeywords: response.ats_keywords || [],
    explanation: response.explanation,
    hasChanges: response.improved_text !== originalText,
  };
}

/**
 * Создает предложение для применения улучшения
 *
 * @param originalText - Оригинальный текст
 * @param improvedText - Улучшенный текст
 * @returns Строка с описанием изменений
 */
export function createChangeSuggestion(
  originalText: string,
  improvedText: string
): string {
  const originalLength = originalText.length;
  const improvedLength = improvedText.length;
  const diff = improvedLength - originalLength;

  if (diff > 50) {
    return `Текст расширен на ${diff} символов`;
  } else if (diff < -50) {
    return `Текст сокращён на ${Math.abs(diff)} символов`;
  } else {
    return "Текст оптимизирован";
  }
}

/**
 * Валидация текста перед отправкой в AI
 *
 * @param text - Текст для проверки
 * @returns true если текст валиден
 */
export function validateTextForAI(text: string): boolean {
  if (!text || text.trim().length < 10) {
    return false;
  }

  // Проверка на повторяющиеся символы (спам)
  const repeatedChars = /(.)\1{10,}/;
  if (repeatedChars.test(text)) {
    return false;
  }

  // Проверка на максимальную длину
  if (text.length > 5000) {
    return false;
  }

  return true;
}

/**
 * Получает подсказки для разных типов полей
 *
 * @param field - Тип поля
 * @returns Текст подсказки
 */
export function getFieldHint(field: string): string {
  const hints: Record<string, string> = {
    about: "Опишите ваш профессиональный опыт, ключевые достижения и цели. Используйте конкретные факты и цифры.",
    experience_description: "Опишите ваши обязанности и достижения. Используйте формулу: делал что → каким результат → с какими метриками.",
    skills: "Перечислите ключевые навыки через запятую. Группируйте по категориям: языки программирования, фреймворки, инструменты.",
    achievements: "Опишите ваши ключевые достижения с конкретными результатами и цифрами.",
  };

  return hints[field] || "";
}

/**
 * Кэширует AI ответы для одинаковых запросов
 */
class AIResponseCache {
  private cache = new Map<string, { response: AIImproveResponse; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 минут

  private getCacheKey(text: string, field: string): string {
    return `${field}:${text.substring(0, 100)}`; // Хэш по первым 100 символам
  }

  get(text: string, field: string): AIImproveResponse | null {
    const key = this.getCacheKey(text, field);
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.response;
    }

    this.cache.delete(key);
    return null;
  }

  set(text: string, field: string, response: AIImproveResponse): void {
    const key = this.getCacheKey(text, field);
    this.cache.set(key, { response, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}

export const aiCache = new AIResponseCache();

/**
 * Улучшение текста с кэшированием
 *
 * @param text - Текст для улучшения
 * @param field - Тип поля
 * @param userId - ID пользователя
 * @param context - Контекст
 * @param useCache - Использовать кэш
 * @returns Улучшенный текст
 */
export async function improveTextWithAICached(
  text: string,
  field: "about" | "experience_description" | "skills" | "achievements",
  userId: string,
  context?: string,
  useCache: boolean = true
): Promise<AIImproveResponse> {
  // Проверяем кэш
  if (useCache) {
    const cached = aiCache.get(text, field);
    if (cached) {
      return cached;
    }
  }

  // Делаем запрос
  const response = await improveTextWithAI(text, field, userId, context);

  // Сохраняем в кэш
  if (useCache) {
    aiCache.set(text, field, response);
  }

  return response;
}

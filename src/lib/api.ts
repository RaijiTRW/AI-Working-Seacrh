/**
 * API клиент для работы с бэкендом
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Vacancy {
  id: string;
  title: string;
  company: string;
  salary_from?: number;
  salary_to?: number;
  city: string;
  experience?: string;
  employment_type?: string;
  description: string;
  url: string;
  source: string;
}

export interface ChatResponse {
  message: string;
  vacancies: Vacancy[];
  chat_id: string;
}

export interface StreamMessage {
  type: "text" | "vacancies" | "rejected_vacancies" | "done";
  content: string | Vacancy[];
  chat_id?: string;
}

/**
 * Отправка сообщения в чат (обычный запрос)
 */
export async function sendMessage(
  message: string,
  userId: string,
  chatId?: string | null
): Promise<ChatResponse> {
  const response = await fetch(`${API_URL}/api/chat/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      user_id: userId,
      chat_id: chatId,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to send message");
  }

  return response.json();
}

/**
 * Отправка сообщения со стримингом
 */
export async function sendMessageStream(
  message: string,
  userId: string,
  chatId: string | null,
  onText: (text: string) => void,
  onVacancies: (vacancies: Vacancy[]) => void,
  onDone: (chatId: string) => void,
  onRejectedVacancies?: (vacancies: Vacancy[]) => void
): Promise<void> {
  const response = await fetch(`${API_URL}/api/chat/message/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      user_id: userId,
      chat_id: chatId,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to send message");
  }

  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");

    // Оставляем последний неполный chunk в буфере
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data: StreamMessage = JSON.parse(line.slice(6));

          switch (data.type) {
            case "text":
              onText(data.content as string);
              break;
            case "vacancies":
              console.log("Received vacancies:", data.content);
              onVacancies(data.content as Vacancy[]);
              break;
            case "rejected_vacancies":
              console.log("Received rejected vacancies:", data.content);
              onRejectedVacancies?.(data.content as Vacancy[]);
              break;
            case "done":
              onDone(data.chat_id || "");
              break;
          }
        } catch (e) {
          console.error("JSON parse error:", e, line);
        }
      }
    }
  }
}

/**
 * Получение предпочтений пользователя
 */
export async function getPreferences(userId: string, chatId?: string): Promise<Record<string, unknown>> {
  const params = new URLSearchParams({ user_id: userId });
  if (chatId) params.append("chat_id", chatId);

  const response = await fetch(`${API_URL}/api/chat/preferences/${userId}?${params}`);
  if (!response.ok) {
    throw new Error("Failed to get preferences");
  }

  return response.json();
}

// === Vacancy Feed API ===

export interface FeedFilters {
  query?: string;
  city?: string;
  salary_from?: number;
  experience?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface FeedResult {
  vacancies: Vacancy[];
  total: number;
  page: number;
  pages: number;
  has_next: boolean;
}

/**
 * Получение ленты вакансий с фильтрацией и пагинацией
 */
export async function getVacancyFeed(filters: FeedFilters): Promise<FeedResult> {
  const params = new URLSearchParams();

  if (filters.query) params.append("query", filters.query);
  if (filters.city) params.append("city", filters.city);
  if (filters.salary_from) params.append("salary_from", filters.salary_from.toString());
  if (filters.experience) params.append("experience", filters.experience);
  if (filters.sort) params.append("sort", filters.sort);
  if (filters.page) params.append("page", filters.page.toString());
  if (filters.limit) params.append("limit", filters.limit.toString());

  const response = await fetch(`${API_URL}/api/vacancies/feed?${params}`);

  if (!response.ok) {
    throw new Error("Failed to fetch vacancies");
  }

  return response.json();
}

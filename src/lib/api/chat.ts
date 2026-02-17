/**
 * Chat API - AI поиск вакансий
 */

// На HTTPS-странице запрещаем небезопасный http:// backend URL.
// В этом случае принудительно используем same-origin /api/* через reverse proxy.
const RAW_API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").trim();

function getApiUrl(): string {
  if (!RAW_API_URL) {
    return "";
  }

  if (
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    RAW_API_URL.startsWith("http://")
  ) {
    return "";
  }

  return RAW_API_URL;
}

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
  user_id?: string; // ID владельца (для platform вакансий)
}

export interface ChatResponse {
  message: string;
  vacancies: Vacancy[];
  chat_id: string;
}

export interface StreamMessage {
  type: "text" | "vacancies" | "vacancies_chunk" | "rejected_vacancies" | "progress" | "done";
  content: string | Vacancy[];
  chat_id?: string;
  message?: string;
}

/**
 * Отправка сообщения в чат (обычный запрос)
 */
export async function sendMessage(
  message: string,
  userId: string,
  chatId?: string | null
): Promise<ChatResponse> {
  const response = await fetch(`${getApiUrl()}/api/chat/message`, {
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

export interface SearchMode {
  searchInFeed: boolean;
  searchOnline: boolean;
}

/**
 * Отправка сообщения со стримингом
 */
export async function sendMessageStream(
  message: string,
  userId: string,
  chatId: string | null,
  searchMode: SearchMode,
  onText: (text: string) => void,
  onVacancies: (vacancies: Vacancy[]) => void,
  onDone: (chatId: string) => void,
  onRejectedVacancies?: (vacancies: Vacancy[]) => void,
  excludeVacancyIds?: string[],
  signal?: AbortSignal
): Promise<void> {
  const response = await fetch(`${getApiUrl()}/api/chat/message/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      user_id: userId,
      chat_id: chatId,
      search_in_feed: searchMode.searchInFeed,
      search_online: searchMode.searchOnline,
      exclude_vacancy_ids: excludeVacancyIds || [],
    }),
    signal,
    keepalive: true,
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
              onVacancies(data.content as Vacancy[]);
              break;
            case "vacancies_chunk":
              // Добавляем вакансии по частям (progressive loading)
              onVacancies(data.content as Vacancy[]);
              break;
            case "rejected_vacancies":
              onRejectedVacancies?.(data.content as Vacancy[]);
              break;
            case "progress":
              // Сообщения о прогрессе загрузки (можно игнорировать)
              break;
            case "done":
              onDone(data.chat_id || "");
              break;
          }
        } catch (e) {
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

  const response = await fetch(`${getApiUrl()}/api/chat/preferences/${userId}?${params}`);
  if (!response.ok) {
    throw new Error("Failed to get preferences");
  }

  return response.json();
}

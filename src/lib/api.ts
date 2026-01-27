/**
 * API клиент для работы с бэкендом
 */

// Python backend - только AI поиск вакансий и scheduler
// В production используем относительный путь (через Caddy прокси)
// В dev используем localhost:8000
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// Next.js API routes - админка, подписки, поддержка
const NEXT_API = "";

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
  const response = await fetch(`${API_URL}/api/chat/message/stream`, {
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
              console.log("Received vacancies:", data.content);
              onVacancies(data.content as Vacancy[]);
              break;
            case "vacancies_chunk":
              // Добавляем вакансии по частям (progressive loading)
              console.log("Received vacancies chunk:", data.content);
              onVacancies(data.content as Vacancy[]);
              break;
            case "rejected_vacancies":
              console.log("Received rejected vacancies:", data.content);
              onRejectedVacancies?.(data.content as Vacancy[]);
              break;
            case "progress":
              // Сообщения о прогрессе загрузки (можно игнорировать или логировать)
              console.log("Progress:", data.message);
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
  cities?: string[];
  salary_from?: number;
  experience?: string;
  source?: string; // platform, network
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
  // Support both single city and multiple cities
  if (filters.cities && filters.cities.length > 0) {
    params.append("city", filters.cities.join(","));
  } else if (filters.city) {
    params.append("city", filters.city);
  }
  if (filters.salary_from) params.append("salary_from", filters.salary_from.toString());
  if (filters.experience) params.append("experience", filters.experience);
  if (filters.source) params.append("source", filters.source);
  if (filters.sort) params.append("sort", filters.sort);
  if (filters.page) params.append("page", filters.page.toString());
  if (filters.limit) params.append("limit", filters.limit.toString());

  // Используем Next.js API route вместо Python backend
  const response = await fetch(`${NEXT_API}/api/vacancies/feed?${params}`);

  if (!response.ok) {
    throw new Error("Failed to fetch vacancies");
  }

  return response.json();
}

// === Vacancy Stats API ===

export interface VacancyStats {
  platform: number;
  network: number;
  total: number;
}

/**
 * Получить статистику вакансий
 */
export async function getVacancyStats(): Promise<VacancyStats> {
  // Используем Next.js API route вместо Python backend
  const response = await fetch(`${NEXT_API}/api/vacancies/stats`);

  if (!response.ok) {
    throw new Error("Failed to fetch vacancy stats");
  }

  return response.json();
}

// === Employer Vacancies API ===

export interface EmployerVacancy {
  id: string;
  user_id: string;
  title: string;
  company: string;
  city: string;
  salary_from?: number;
  salary_to?: number;
  salary_currency: string;
  experience?: string;
  employment_type?: string;
  schedule?: string;
  description: string;
  requirements?: string;
  conditions?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  status: string;
  is_active: boolean;
  views_count: number;
  responses_count: number;
  created_at?: string;
  updated_at?: string;
  published_at?: string;
}

export interface EmployerVacancyCreate {
  title: string;
  company: string;
  city: string;
  salary_from?: number;
  salary_to?: number;
  salary_currency?: string;
  experience?: string;
  employment_type?: string;
  schedule?: string;
  description: string;
  requirements?: string;
  conditions?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
}

export interface EmployerVacancyList {
  vacancies: EmployerVacancy[];
  total: number;
  page: number;
  pages: number;
  has_next: boolean;
}

/**
 * Создать вакансию
 */
export async function createVacancy(
  vacancy: EmployerVacancyCreate,
  token: string
): Promise<EmployerVacancy> {
  const response = await fetch(`/api/employer/vacancies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(vacancy),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to create vacancy");
  }

  return response.json();
}

/**
 * Получить мои вакансии
 */
export async function getMyVacancies(
  token: string,
  page = 1,
  limit = 20
): Promise<EmployerVacancyList> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  const response = await fetch(`/api/employer/vacancies?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch vacancies");
  }

  return response.json();
}

/**
 * Опубликовать вакансию
 */
export async function publishVacancy(
  vacancyId: string,
  token: string
): Promise<EmployerVacancy> {
  const response = await fetch(
    `/api/employer/vacancies/${vacancyId}/publish`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to publish vacancy");
  }

  return response.json();
}

/**
 * Удалить вакансию
 */
export async function deleteVacancy(
  vacancyId: string,
  token: string
): Promise<void> {
  const response = await fetch(
    `/api/employer/vacancies/${vacancyId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete vacancy");
  }
}

/**
 * Получить вакансию по ID
 */
export async function getVacancyById(
  vacancyId: string
): Promise<EmployerVacancy> {
  const response = await fetch(
    `/api/employer/vacancies/${vacancyId}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch vacancy");
  }

  return response.json();
}

/**
 * Обновить вакансию
 */
export async function updateVacancy(
  vacancyId: string,
  updates: Partial<EmployerVacancyCreate>,
  token: string
): Promise<EmployerVacancy> {
  const response = await fetch(
    `/api/employer/vacancies/${vacancyId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update vacancy");
  }

  return response.json();
}

/**
 * Увеличить счётчик просмотров вакансии
 */
export async function incrementVacancyViews(vacancyId: string): Promise<void> {
  try {
    await fetch(`/api/employer/vacancies/${vacancyId}/view`, {
      method: "POST",
    });
  } catch {
    // Ignore errors for view tracking
  }
}

// === Admin API ===

export interface AdminStats {
  total_users: number;
  online_users: number;
  banned_users: number;
  admins_count: number;
  platform_vacancies: number;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  is_banned: boolean;
  ban_reason?: string;
  can_create_vacancies: boolean;
  subscription_type?: string;
  subscription_expires_at?: string;
  last_seen_at?: string;
  created_at?: string;
  bonus_requests?: number;
  daily_limit?: number;
  daily_used?: number;
}

export interface AdminUserList {
  users: AdminUser[];
  total: number;
  page: number;
  pages: number;
}

export interface SiteSetting {
  id: string;
  value: { enabled: boolean; discount_percent?: number };
  updated_at?: string;
}

/**
 * Получить статистику админ-панели
 */
export async function getAdminStats(token: string): Promise<AdminStats> {
  const response = await fetch(`${NEXT_API}/api/admin/stats`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch admin stats");
  }

  return response.json();
}

/**
 * Получить список пользователей
 */
export async function getAdminUsers(
  token: string,
  page = 1,
  limit = 20,
  search?: string
): Promise<AdminUserList> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (search) params.append("search", search);

  const response = await fetch(`${NEXT_API}/api/admin/users?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }

  return response.json();
}

/**
 * Забанить пользователя
 */
export async function banUser(
  token: string,
  userId: string,
  reason?: string
): Promise<void> {
  const response = await fetch(`${NEXT_API}/api/admin/users/${userId}/ban`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    throw new Error("Failed to ban user");
  }
}

/**
 * Разбанить пользователя
 */
export async function unbanUser(token: string, userId: string): Promise<void> {
  const response = await fetch(`${NEXT_API}/api/admin/users/${userId}/unban`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to unban user");
  }
}

/**
 * Забанить/разбанить создание вакансий (с причиной)
 */
export async function toggleUserVacancies(
  token: string,
  userId: string,
  reason?: string
): Promise<{ success: boolean; can_create_vacancies: boolean; reason?: string | null }> {
  const response = await fetch(
    `${NEXT_API}/api/admin/users/${userId}/toggle-vacancies`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to toggle vacancies");
  }

  return response.json();
}

/**
 * Установить подписку пользователю
 */
export async function setUserSubscription(
  token: string,
  userId: string,
  subscriptionType: string,
  expiresAt?: string
): Promise<void> {
  const response = await fetch(
    `${NEXT_API}/api/admin/users/${userId}/subscription`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        subscription_type: subscriptionType,
        expires_at: expiresAt,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to set subscription");
  }
}

/**
 * Установить роль пользователю
 */
export async function setUserRole(
  token: string,
  userId: string,
  role: string
): Promise<void> {
  const response = await fetch(`${NEXT_API}/api/admin/users/${userId}/role`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ role }),
  });

  if (!response.ok) {
    throw new Error("Failed to set role");
  }
}

/**
 * Добавить/убавить бонусные запросы пользователю
 */
export async function addUserRequests(
  token: string,
  userId: string,
  amount: number
): Promise<void> {
  const response = await fetch(`${NEXT_API}/api/admin/users/${userId}/requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ amount }),
  });

  if (!response.ok) {
    throw new Error("Failed to add requests");
  }
}

/**
 * Сбросить использованные сегодня запросы (daily_used = 0)
 */
export async function resetDailyUsage(
  token: string,
  userId: string
): Promise<void> {
  const response = await fetch(`${NEXT_API}/api/admin/users/${userId}/reset-daily`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to reset daily usage");
  }
}

/**
 * Получить настройки сайта
 */
export async function getSiteSettings(token: string): Promise<SiteSetting[]> {
  const response = await fetch(`${NEXT_API}/api/admin/settings`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch settings");
  }

  const data = await response.json();
  return data.settings || [];
}

/**
 * Обновить настройку сайта
 */
export async function updateSiteSetting(
  token: string,
  settingId: string,
  enabled: boolean
): Promise<void> {
  const response = await fetch(`${NEXT_API}/api/admin/settings/${settingId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ enabled }),
  });

  if (!response.ok) {
    throw new Error("Failed to update setting");
  }
}

/**
 * Обновить настройку скидки
 */
export async function updateDiscountSetting(
  token: string,
  settingId: string,
  enabled: boolean,
  discountPercent: number
): Promise<void> {
  const response = await fetch(`${NEXT_API}/api/admin/settings/${settingId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ enabled, discount_percent: discountPercent }),
  });

  if (!response.ok) {
    throw new Error("Failed to update discount setting");
  }
}

/**
 * Проверить, является ли пользователь админом
 */
export async function checkIsAdmin(token: string): Promise<boolean> {
  try {
    console.log("checkIsAdmin: calling", `${NEXT_API}/api/admin/stats`);
    const response = await fetch(`${NEXT_API}/api/admin/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("checkIsAdmin: response status", response.status);
    if (!response.ok) {
      const text = await response.text();
      console.log("checkIsAdmin: error response", text);
    }
    return response.ok;
  } catch (err) {
    console.error("checkIsAdmin: exception", err);
    return false;
  }
}

// === Employer Vacancy Moderation API ===

export interface EmployerVacancyModeration extends EmployerVacancy {
  rejection_reason?: string;
  moderation_checked_at?: string;
  moderated_by?: string;
  profiles?: {
    full_name?: string;
    email: string;
  };
}

export interface EmployerVacancyModerationList {
  vacancies: EmployerVacancyModeration[];
  total: number;
  page: number;
  pages: number;
  has_next: boolean;
}

/**
 * Получить вакансии на модерации или отклоненные
 */
export async function getEmployerVacanciesForModeration(
  token: string,
  status: "pending_review" | "rejected" = "pending_review",
  page = 1,
  limit = 20
): Promise<EmployerVacancyModerationList> {
  const params = new URLSearchParams({
    status,
    page: page.toString(),
    limit: limit.toString(),
  });

  const response = await fetch(`${NEXT_API}/api/admin/employer-vacancies?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch vacancies for moderation");
  }

  return response.json();
}

/**
 * Одобрить вакансию работодателя вручную
 */
export async function approveEmployerVacancy(
  token: string,
  vacancyId: string
): Promise<void> {
  const response = await fetch(
    `${NEXT_API}/api/admin/employer-vacancies/${vacancyId}/approve`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to approve vacancy");
  }
}

/**
 * Отклонить вакансию работодателя вручную
 */
export async function rejectEmployerVacancy(
  token: string,
  vacancyId: string,
  reason: string
): Promise<void> {
  const response = await fetch(
    `${NEXT_API}/api/admin/employer-vacancies/${vacancyId}/reject`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to reject vacancy");
  }
}

// === Scheduler API ===

export interface SchedulerJobStatus {
  job_id: string;
  name: string;
  status: "active" | "paused" | "running";
  is_paused: boolean;
  next_run: string | null;
  last_run: {
    started_at: string;
    ended_at: string;
    duration_seconds: number;
    stats: {
      parsed?: number;
      saved?: number;
      total_saved?: number;
      errors?: string[];
      checked?: number;
      marked_inactive?: number;
      still_active?: number;
      hh?: { parsed: number; saved: number };
      superjob?: { parsed: number; saved: number };
    };
  } | null;
  trigger: string;
}

export interface SchedulerStatus {
  scheduler_running: boolean;
  jobs: SchedulerJobStatus[];
}

export interface JobHistoryItem {
  id: string;
  job_id: string;
  job_name: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  stats: Record<string, unknown>;
}

export interface VolumeDataPoint {
  recorded_at: string;
  hh: number;
  superjob: number;
  avito: number;
  platform: number;
  total: number;
}

/**
 * Получить статус планировщика
 */
export async function getSchedulerStatus(token: string): Promise<SchedulerStatus> {
  const response = await fetch(`${API_URL}/api/admin/scheduler/status`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch scheduler status");
  }

  return response.json();
}

/**
 * Поставить джоб на паузу
 */
export async function pauseJob(token: string, jobId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/admin/scheduler/jobs/${jobId}/pause`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to pause job");
  }
}

/**
 * Возобновить джоб
 */
export async function resumeJob(token: string, jobId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/admin/scheduler/jobs/${jobId}/resume`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to resume job");
  }
}

/**
 * Запустить джоб вручную
 */
export async function triggerJob(token: string, jobId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/admin/scheduler/jobs/${jobId}/trigger`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to trigger job");
  }
}

/**
 * Получить историю выполнения джобов
 */
export async function getJobHistory(
  token: string,
  jobId?: string,
  limit = 50
): Promise<JobHistoryItem[]> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (jobId) params.append("job_id", jobId);

  const response = await fetch(`${API_URL}/api/admin/scheduler/history?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch job history");
  }

  return response.json();
}

/**
 * Получить историю объёма вакансий для графика
 */
export async function getVolumeStats(
  token: string,
  hours = 168
): Promise<VolumeDataPoint[]> {
  const response = await fetch(`${API_URL}/api/admin/scheduler/volume?hours=${hours}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch volume stats");
  }

  return response.json();
}

// === Conversations API ===

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at?: string;
}

export interface Conversation {
  id: string;
  vacancy_id: string;
  applicant_id: string;
  employer_id: string;
  status: string;
  last_message_at?: string;
  applicant_unread_count: number;
  employer_unread_count: number;
  created_at?: string;
  vacancy_title?: string;
  vacancy_company?: string;
  applicant_name?: string;
  applicant_email?: string;
}

export interface ConversationList {
  conversations: Conversation[];
  total: number;
}

export interface MessageList {
  messages: ConversationMessage[];
  total: number;
}

/**
 * Создать или получить чат для вакансии
 */
export async function createConversation(
  vacancyId: string,
  token: string
): Promise<Conversation> {
  const response = await fetch(`/api/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ vacancy_id: vacancyId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to create conversation");
  }

  return response.json();
}

/**
 * Получить свои чаты
 */
export async function getConversations(
  token: string,
  page = 1
): Promise<ConversationList> {
  const params = new URLSearchParams({ page: page.toString() });

  const response = await fetch(`/api/conversations?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch conversations");
  }

  return response.json();
}

/**
 * Получить количество непрочитанных сообщений
 */
export async function getUnreadCount(token: string): Promise<number> {
  const response = await fetch(`/api/conversations/unread`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return 0;
  }

  const data = await response.json();
  return data.count;
}

/**
 * Получить сообщения из чата
 */
export async function getMessages(
  conversationId: string,
  token: string,
  page = 1
): Promise<MessageList> {
  const params = new URLSearchParams({ page: page.toString() });

  const response = await fetch(
    `/api/conversations/${conversationId}/messages?${params}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch messages");
  }

  return response.json();
}

/**
 * Отправить сообщение
 */
export async function sendConversationMessage(
  conversationId: string,
  content: string,
  token: string
): Promise<ConversationMessage> {
  const response = await fetch(
    `/api/conversations/${conversationId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to send message");
  }

  return response.json();
}

/**
 * Отметить сообщения как прочитанные
 */
export async function markAsRead(
  conversationId: string,
  token: string
): Promise<void> {
  await fetch(`/api/conversations/${conversationId}/read`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// === Subscription API ===

export interface Subscription {
  plan: "pro_trial" | "base" | "pro";
  status: "active" | "expired" | "cancelled";
  expires_at: string | null;  // null для base плана
  days_left: number | null;   // null для base плана
  can_search_online: boolean; // false для base плана
}

export interface RequestLimits {
  daily_limit: number;
  daily_used: number;
  bonus_requests: number;
  remaining: number;
  can_use: boolean;
}

export interface SubscriptionPrices {
  subscription: number;
  subscription_discounted?: number;
  extra_requests: number;
  extra_requests_count: number;
}

export interface DiscountInfo {
  enabled: boolean;
  percent: number;
  is_first_purchase: boolean;
}

export interface SubscriptionInfo {
  subscription: Subscription | null;
  limits: RequestLimits;
  // Флаги планов
  is_pro_trial: boolean;       // На Pro Trial (7 дней)
  is_base: boolean;            // На Base (бесплатный навсегда)
  is_pro: boolean;             // На Pro (платная подписка)
  is_pro_trial_expired: boolean; // Pro Trial истёк, показать модалку
  is_pro_expired: boolean;     // Платная Pro подписка истекла
  prices: SubscriptionPrices;
  discount?: DiscountInfo;     // Информация о скидке на первую покупку
}

export interface CheckoutResponse {
  payment_id: string;
  payment_url: string;
}

export interface PaymentStatus {
  status: string;
  paid: boolean;
  type?: "subscription" | "extra_requests";
}

/**
 * Получить информацию о подписке текущего пользователя
 */
export async function getSubscription(token: string): Promise<SubscriptionInfo> {
  const response = await fetch(`${NEXT_API}/api/subscription`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized");
    }
    throw new Error("Failed to fetch subscription");
  }

  return response.json();
}

/**
 * Создать платёж для подписки Pro
 */
export async function createSubscriptionCheckout(
  token: string
): Promise<CheckoutResponse> {
  const response = await fetch(`${NEXT_API}/api/subscription/checkout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to create checkout");
  }

  return response.json();
}

/**
 * Создать платёж для докупки запросов
 */
export async function buyExtraRequests(
  token: string
): Promise<CheckoutResponse> {
  const response = await fetch(`${NEXT_API}/api/subscription/extra`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to create payment");
  }

  return response.json();
}

/**
 * Проверить статус платежа
 */
export async function checkPaymentStatus(
  token: string,
  paymentId: string
): Promise<PaymentStatus> {
  const response = await fetch(
    `${NEXT_API}/api/subscription/check/${paymentId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to check payment status");
  }

  return response.json();
}

/**
 * Отменить pending платёж
 */
export async function cancelPayment(
  token: string,
  paymentId: string
): Promise<{ status: string; message?: string }> {
  const response = await fetch(
    `${NEXT_API}/api/subscription/cancel/${paymentId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to cancel payment");
  }

  return response.json();
}

/**
 * Создать триал подписку (если не создалась автоматически)
 */
export async function createTrial(token: string): Promise<void> {
  const response = await fetch(`${NEXT_API}/api/subscription/create-trial`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to create trial");
  }
}

/**
 * Admin API - управление пользователями, настройками, модерацией
 */

const NEXT_API = "";

export interface AdminStats {
  total_users: number;
  online_users: number;
  banned_users: number;
  admins_count: number;
  platform_vacancies: number;
}

export interface AdminUser {
  id: string;
  user_id: string;
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
  value: { enabled: boolean; discount_percent?: number } | { price: number };
  updated_at?: string;
}

export interface AdminPayment {
  id: string;
  user_id: string;
  type: "subscription" | "extra_requests" | string;
  amount: number | string;
  currency?: string | null;
  status: "pending" | "succeeded" | "failed" | "canceled" | string;
  yookassa_payment_id?: string | null;
  yookassa_status?: string | null;
  payment_method_id?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  email?: string | null;
  full_name?: string | null;
}

export interface AdminPaymentList {
  payments: AdminPayment[];
  total: number;
  page: number;
  pages: number;
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
 * Получить историю платежей для админ-панели
 */
export async function getAdminPayments(
  token: string,
  page = 1,
  limit = 20
): Promise<AdminPaymentList> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  const response = await fetch(`${NEXT_API}/api/admin/payments?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch payments");
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
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Failed to add requests");
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
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Failed to reset daily usage");
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
    const response = await fetch(`${NEXT_API}/api/admin/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.ok;
  } catch (err) {
    return false;
  }
}

// === Employer Vacancy Moderation API ===

export interface EmployerVacancyModeration {
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
  rejection_reason?: string;
  moderation_checked_at?: string;
  moderated_by?: string;
  company_url?: string;
  company_logo?: string;
  skills?: string[];
  work_hours?: string;
  valid_through?: string;
  is_public?: boolean;
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

// === Admin Chats API ===

export interface AdminChat {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  email: string;
  message_count: number;
}

export interface AdminChatList {
  chats: AdminChat[];
  total: number;
  page: number;
  pages: number;
}

export interface AdminChatMessage {
  id: string;
  chat_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  vacancies: any[] | null;
}

export interface AdminChatDetail {
  chat: AdminChat;
  messages: AdminChatMessage[];
}

/**
 * Получить список всех чатов (админка)
 */
export async function getAdminChats(
  token: string,
  page = 1,
  limit = 50,
  search?: string
): Promise<AdminChatList> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (search) params.append("search", search);

  const response = await fetch(`${NEXT_API}/api/admin/chats?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch chats");
  }

  return response.json();
}

/**
 * Получить сообщения конкретного чата (админка)
 */
export async function getAdminChatMessages(
  token: string,
  chatId: string
): Promise<AdminChatDetail> {
  const response = await fetch(`${NEXT_API}/api/admin/chats/${chatId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch chat messages");
  }

  return response.json();
}

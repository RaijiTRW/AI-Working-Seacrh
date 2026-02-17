/**
 * Vacancies API - Feed, Stats, Employer Vacancies
 */

// Import Vacancy type from chat module for internal use
import type { Vacancy } from "./chat";

// Re-export for external use
export type { Vacancy } from "./chat";

// Next.js API routes - админка, подписки, поддержка
const NEXT_API = "";

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
  rejection_reason?: string;
  moderation_checked_at?: string;
  moderated_by?: string;
  // SEO fields
  company_url?: string;
  company_logo?: string;
  skills?: string[];
  work_hours?: string;
  valid_through?: string;
  is_public?: boolean;
}

/**
 * Network vacancy type (hh.ru, avito, superjob)
 */
export interface NetworkVacancy {
  id: string;
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
  url: string;
  source: "hh" | "avito" | "superjob";
  source_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  published_at?: string;
  company_url?: string;
  company_logo?: string;
  skills?: string[];
  work_hours?: string;
  valid_through?: string;
  is_network: true;
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

  const data = await response.json();
  return data;
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
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`Failed to publish vacancy: ${errorText}`);
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
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`Failed to delete vacancy: ${errorText}`);
  }
}

/**
 * Отозвать вакансию с модерации (вернуть в черновики)
 */
export async function withdrawVacancy(
  vacancyId: string,
  token: string
): Promise<void> {
  const response = await fetch(
    `/api/employer/vacancies/${vacancyId}/withdraw`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to withdraw vacancy");
  }
}

/**
 * Получить вакансию по ID
 */
export async function getVacancyById(
  vacancyId: string
): Promise<EmployerVacancy> {
  // Use absolute URL for server-side rendering compatibility
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobaisearch.ru";
  const response = await fetch(
    `${baseUrl}/api/employer/vacancies/${vacancyId}`,
    {
      // Required for server-side rendering
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch vacancy");
  }

  return response.json();
}

/**
 * Get network vacancy by composite ID (format: "source_sourceId")
 * Examples: "hh_12345678", "avito_98765432", "superjob_11223344"
 */
export async function getNetworkVacancy(
  vacancyId: string
): Promise<NetworkVacancy> {
  // Use absolute URL for server-side rendering compatibility
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobaisearch.ru";
  const response = await fetch(
    `${baseUrl}/api/network-vacancies/${vacancyId}`,
    {
      // Required for server-side rendering
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch network vacancy");
  }

  return response.json();
}

/**
 * Check if vacancy ID is a network vacancy (format: "source_sourceId")
 */
export function isNetworkVacancyId(vacancyId: string): boolean {
  const parts = vacancyId.split("_");
  if (parts.length < 2) return false;

  const source = parts[0];
  const validSources = ["hh", "avito", "superjob"];
  return validSources.includes(source);
}

/**
 * Get vacancy (platform or network) by ID
 * Automatically detects type and fetches from appropriate source
 */
export async function getVacancy(
  vacancyId: string
): Promise<EmployerVacancy | NetworkVacancy> {
  if (isNetworkVacancyId(vacancyId)) {
    return getNetworkVacancy(vacancyId);
  }
  return getVacancyById(vacancyId);
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

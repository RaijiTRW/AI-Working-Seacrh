/**
 * Scheduler API - управление планировщиком задач
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const NEXT_API = "";

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
  // Add cache-busting parameter
  const cacheBuster = Date.now();
  const response = await fetch(`${API_URL}/api/admin/scheduler/status?_=${cacheBuster}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Cache-Control': 'no-cache',
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch scheduler status");
  }

  return response.json();
}

/**
 * Получить состояние джобов (is_paused) напрямую из Supabase
 */
export async function getJobStates(token: string): Promise<Record<string, { is_paused: boolean }>> {
  const response = await fetch(`${NEXT_API}/api/admin/scheduler/job-state`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    // Если ошибка, возвращаем пустой объект (по умолчанию все активны)
    console.error("Failed to fetch job states, using defaults");
    return {};
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
 * Остановить джоб
 */
export async function stopJob(token: string, jobId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/admin/scheduler/jobs/${jobId}/stop`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to stop job");
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

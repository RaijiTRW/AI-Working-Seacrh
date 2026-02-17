"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getSchedulerStatus,
  getJobHistory,
  getVolumeStats,
  pauseJob,
  resumeJob,
  triggerJob,
  SchedulerStatus,
  JobHistoryItem,
  VolumeDataPoint,
} from "@/lib/api";
import PlatformStatusCard from "./PlatformStatusCard";
import JobHistoryTable from "./JobHistoryTable";
import VolumeChart from "./VolumeChart";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

interface SchedulerTabProps {
  token: string;
}

interface DebugInfo {
  scheduler_job_history?: { exists: boolean; count: number; error?: string };
  vacancy_volume_stats?: { exists: boolean; count: number; error?: string };
  scheduler_job_state?: { exists: boolean; count: number; states?: any[]; error?: string };
  backend?: { url: string; status: string };
}

export default function SchedulerTab({ token }: SchedulerTabProps) {
  const [status, setStatus] = useState<SchedulerStatus | null>(null);
  const [history, setHistory] = useState<JobHistoryItem[]>([]);
  const [volumeData, setVolumeData] = useState<VolumeDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [isCreatingTestData, setIsCreatingTestData] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [statusData, historyData, volumeDataResult] = await Promise.all([
        getSchedulerStatus(token),
        getJobHistory(token, undefined, 20),
        getVolumeStats(token, 168), // 7 days
      ]);

      setStatus(statusData);
      setHistory(historyData);
      setVolumeData(volumeDataResult);
    } catch (err) {
      setError("Не удалось загрузить данные планировщика");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
    // Refresh every 3 seconds if any job is running, otherwise 30 seconds
    const hasRunningJob = status?.jobs.some(j => j.status === "running");
    const interval = setInterval(fetchData, hasRunningJob ? 3000 : 30000);
    return () => clearInterval(interval);
  }, [fetchData, status]);

  const handlePause = async (jobId: string) => {
    try {
      setActionLoading(jobId);
      await pauseJob(token, jobId);
      await fetchData();
    } catch (err) {
      setError("Не удалось остановить задачу");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResume = async (jobId: string) => {
    try {
      setActionLoading(jobId);
      await resumeJob(token, jobId);
      await fetchData();
    } catch (err) {
      setError("Не удалось возобновить задачу");
    } finally {
      setActionLoading(null);
    }
  };

  const handleTrigger = async (jobId: string) => {
    try {
      setActionLoading(jobId);
      await triggerJob(token, jobId);
      // Wait a bit for the job to start
      setTimeout(fetchData, 2000);
    } catch (err) {
      setError("Не удалось запустить задачу");
    } finally {
      setActionLoading(null);
    }
  };

  const handleStop = async (jobId: string) => {
    try {
      setActionLoading(jobId);
      const response = await fetch(`${API_URL}/api/admin/scheduler/jobs/${jobId}/stop`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to stop job");
      await fetchData();
    } catch (err) {
      setError("Не удалось остановить задачу");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDebug = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/scheduler/debug`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setDebugInfo(data);
        setShowDebug(true);
      }
    } catch (err) {
    }
  };

  const handleCreateTestData = async () => {
    try {
      setIsCreatingTestData(true);
      const response = await fetch(`${API_URL}/api/admin/scheduler/debug`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        await fetchData();
        setShowDebug(false);
      }
    } catch (err) {
    } finally {
      setIsCreatingTestData(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="h-32 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
          <div className="h-48 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
        {error}
      </div>
    );
  }

  // Sort jobs: mass_parsing_job (лента) первый, потом verification
  // Старые parsing_job и avito_job в конец (deprecated/отключены)
  const sortedJobs = status?.jobs.sort((a, b) => {
    const order = ["mass_parsing_job", "verification_job", "parsing_job", "avito_job"];
    return order.indexOf(a.job_id) - order.indexOf(b.job_id);
  }) || [];

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Scheduler status */}
      <div className="flex items-center gap-2 text-sm">
        <div className={`w-2 h-2 rounded-full ${status?.scheduler_running ? "bg-green-500" : "bg-red-500"}`} />
        <span className="text-gray-600">
          Планировщик: {status?.scheduler_running ? "работает" : "остановлен"}
        </span>
      </div>

      {/* Platform cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sortedJobs.map((job) => (
          <PlatformStatusCard
            key={job.job_id}
            job={job}
            onPause={() => handlePause(job.job_id)}
            onResume={() => handleResume(job.job_id)}
            onStop={() => handleStop(job.job_id)}
            onTrigger={() => handleTrigger(job.job_id)}
            isLoading={actionLoading === job.job_id}
          />
        ))}
      </div>

      {/* Job history */}
      <JobHistoryTable history={history} />

      {/* Volume chart */}
      <VolumeChart data={volumeData} height={220} />

      {/* Debug section when no data */}
      {(!status || history.length === 0 || volumeData.length === 0) && !isLoading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-yellow-800 mb-1">Нет данных от планировщика</h4>
              <p className="text-sm text-yellow-700 mb-3">
                Это может означать, что:
              </p>
              <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1 mb-3">
                <li>Миграция Supabase не применена (таблицы не существуют)</li>
                <li>Python бэкенд не запущен</li>
                <li>Планировщик еще не выполнился ни разу</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDebug}
                className="px-3 py-1.5 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-lg hover:bg-yellow-200 transition-colors"
              >
                Диагностика
              </button>
            </div>
          </div>

          {/* Debug info panel */}
          {showDebug && debugInfo && (
            <div className="mt-4 pt-4 border-t border-yellow-200">
              <h5 className="font-medium text-yellow-800 mb-2">Результаты диагностики:</h5>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Таблица scheduler_job_history:</span>
                  {debugInfo.scheduler_job_history?.exists ? (
                    <span className="text-green-700">Существует ({debugInfo.scheduler_job_history.count} записей)</span>
                  ) : (
                    <span className="text-red-700">Не существует</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Таблица vacancy_volume_stats:</span>
                  {debugInfo.vacancy_volume_stats?.exists ? (
                    <span className="text-green-700">Существует ({debugInfo.vacancy_volume_stats.count} записей)</span>
                  ) : (
                    <span className="text-red-700">Не существует</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Таблица scheduler_job_state:</span>
                  {debugInfo.scheduler_job_state?.exists ? (
                    <span className="text-green-700">Существует ({debugInfo.scheduler_job_state.count} записей)</span>
                  ) : (
                    <span className="text-red-700">Не существует</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Python бэкенд:</span>
                  {debugInfo.backend?.status === "ok" ? (
                    <span className="text-green-700">Доступен ({debugInfo.backend.url})</span>
                  ) : debugInfo.backend?.status === "unreachable" ? (
                    <span className="text-red-700">Недоступен ({debugInfo.backend.url})</span>
                  ) : (
                    <span className="text-gray-600">{debugInfo.backend?.status}</span>
                  )}
                </div>
              </div>

              {/* Create test data button */}
              {(debugInfo.scheduler_job_history?.exists === false ||
                debugInfo.vacancy_volume_stats?.exists === false) && (
                <div className="mt-3 pt-3 border-t border-yellow-200">
                  <p className="text-sm text-yellow-700 mb-2">
                    Таблицы не существуют. Примените миграцию Supabase:
                  </p>
                  <code className="block bg-white p-2 rounded text-xs mb-2">
                    supabase/migrations/011_scheduler_monitoring.sql
                  </code>
                </div>
              )}

              {/* Tables exist but no data */}
              {debugInfo.scheduler_job_history?.exists === true &&
                debugInfo.scheduler_job_history.count === 0 &&
                debugInfo.backend?.status === "ok" && (
                <div className="mt-3 pt-3 border-t border-yellow-200">
                  <p className="text-sm text-yellow-700 mb-2">
                    Таблицы существуют, но нет данных. Планировщик не запускался.
                  </p>
                  <button
                    onClick={handleCreateTestData}
                    disabled={isCreatingTestData}
                    className="px-3 py-1.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                  >
                    {isCreatingTestData ? "Создание..." : "Создать тестовые данные"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

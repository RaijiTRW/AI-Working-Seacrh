"use client";

import { useState, useEffect } from "react";
import {
  getAgentsStatus,
  toggleAgent,
  AgentsStatus,
  getSchedulerStatus,
  SchedulerJobStatus,
  pauseJob,
  resumeJob,
  triggerJob,
  stopJob,
  getJobStates
} from "@/lib/api";
import AgentCard from "./AgentCard";

interface AgentsTabProps {
  token: string;
}

export default function AgentsTab({ token }: AgentsTabProps) {
  const [agents, setAgents] = useState<AgentsStatus>({});
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerJobStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      // Fetch agents, scheduler status, and job states (direct from DB)
      const [agentsData, schedulerData, jobStatesData] = await Promise.allSettled([
        getAgentsStatus(token),
        getSchedulerStatus(token),
        getJobStates(token)  // Прямое чтение из Supabuse
      ]);

      if (agentsData.status === 'fulfilled') {
        setAgents(agentsData.value);
      }

      if (schedulerData.status === 'fulfilled' && jobStatesData.status === 'fulfilled') {
        const jobStates = jobStatesData.value || {};

        // Объединяем scheduler status с job states из БД
        const jobs = (schedulerData.value.jobs || []).map(job => ({
          ...job,
          is_paused: jobStates[job.job_id]?.is_paused || false
        }));

        setSchedulerStatus(jobs);
      } else if (schedulerData.status === 'fulfilled') {
        // Если не удалось получить job states, просто используем scheduler data
        setSchedulerStatus(schedulerData.value.jobs || []);
      }

      // Only show error if all failed
      if (agentsData.status === 'rejected' && schedulerData.status === 'rejected') {
        setError("Не удалось загрузить данные. Проверьте подключение к серверу.");
      }
    } catch (err) {
      setError("Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [token]);

  const handleToggleAgent = async (agentId: string, enabled: boolean) => {
    try {
      setActionLoading(agentId);
      await toggleAgent(token, agentId, enabled);
      await fetchData();
    } catch (err) {
      setError("Не удалось изменить статус агента");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePauseJob = async (jobId: string) => {
    try {
      setActionLoading(jobId);
      await pauseJob(token, jobId);
      // Refresh data from DB to get actual state
      await fetchData();
    } catch (err) {
      setError("Не удалось остановить задачу");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResumeJob = async (jobId: string) => {
    try {
      setActionLoading(jobId);
      await resumeJob(token, jobId);
      // Refresh data from DB to get actual state
      await fetchData();
    } catch (err) {
      setError("Не удалось возобновить задачу");
    } finally {
      setActionLoading(null);
    }
  };

  const handleTriggerJob = async (jobId: string) => {
    try {
      await triggerJob(token, jobId);
      // Refresh data from DB to get actual state
      await fetchData();
    } catch (err) {
      setError("Не удалось запустить задачу");
    }
  };

  const handleStopJob = async (jobId: string) => {
    try {
      setActionLoading(jobId);
      await stopJob(token, jobId);
      // Refresh data from DB to get actual state
      await fetchData();
    } catch (err) {
      setError("Не удалось остановить задачу");
    } finally {
      setActionLoading(null);
    }
  };

  // AI Agents to show
  const aiAgentsToShow = [
    "content_moderator",
    "employer_moderator",
  ];

  // Scheduler jobs are shown as parser cards
  // Exclude volume_stats_job - it's just stats recording, not a parser
  // Exclude moderation_job - it's the same as content_moderator AI agent
  const parserJobs = schedulerStatus.filter(job =>
    job.job_id !== 'volume_stats_job' && job.job_id !== 'moderation_job'
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
            <div className="h-24 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

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

      {/* Info message */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Управление AI агентами и парсерами</p>
            <p className="text-blue-700">
              Здесь можно включать и выключать AI агенты и управлять парсерами вакансий.
              Support Chat управляется отдельно во вкладке "Настройки".
            </p>
          </div>
        </div>
      </div>

      {/* AI Agents Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">AI Агенты</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {aiAgentsToShow.map((agentId) => {
            const agent = agents[agentId];
            if (!agent) return null;

            return (
              <AgentCard
                key={agentId}
                agent={agent}
                onToggle={(enabled) => handleToggleAgent(agentId, enabled)}
                isLoading={actionLoading === agentId}
              />
            );
          })}
        </div>

        {/* No agents message */}
        {aiAgentsToShow.every((id) => !agents[id]) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-800 text-sm">
            Нет доступных AI агентов. Убедитесь что Python бэкенд запущен.
          </div>
        )}
      </div>

      {/* Parsers Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Парсеры</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {parserJobs.map((job) => (
            <ParserJobCard
              key={job.job_id}
              job={job}
              onPause={() => handlePauseJob(job.job_id)}
              onResume={() => handleResumeJob(job.job_id)}
              onStop={() => handleStopJob(job.job_id)}
              onTrigger={() => handleTriggerJob(job.job_id)}
              isLoading={actionLoading === job.job_id}
            />
          ))}
        </div>

        {/* No parsers message */}
        {parserJobs.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-800 text-sm">
            Нет доступных парсеров. Убедитесь что Python бэкенд запущен.
          </div>
        )}
      </div>
    </div>
  );
}

// Parser Job Card Component
interface ParserJobCardProps {
  job: SchedulerJobStatus;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onTrigger: () => void;
  isLoading?: boolean;
}

const JOB_INFO: Record<string, { icon: string; name: string; description: string }> = {
  mass_parsing_job: {
    icon: "📥",
    name: "Парсинг ленты",
    description: "Сбор вакансий с HH и SuperJob (каждые 2 часа)"
  },
  verification_job: {
    icon: "✓",
    name: "Верификация",
    description: "Проверка активности вакансий (каждый час)"
  },
  moderation_job: {
    icon: "🤖",
    name: "Модерация",
    description: "AI-модерация контента (каждый час)"
  },
  volume_stats_job: {
    icon: "📊",
    name: "Статистика",
    description: "Сбор статистики (каждый час)"
  },
};

function ParserJobCard({ job, onPause, onResume, onStop, onTrigger, isLoading }: ParserJobCardProps) {
  const info = JOB_INFO[job.job_id] || { icon: "⚙️", name: job.name, description: "Задача" };

  // is_running - true когда прямо сейчас выполняется
  // is_paused - true когда автоматический запуск отключён
  const isRunning = job.status === "running";
  const isPaused = job.is_paused;

  // Форматируем время следующего запуска
  const formatNextRun = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 0) return "Скоро...";
    if (diffMins < 1) return "Менее минуты";
    if (diffMins < 60) return `через ${diffMins} мин`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `через ${diffHours} ч ${diffMins % 60} мин`;

    return date.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`bg-white rounded-xl border p-5 shadow-sm transition-all ${isRunning ? "border-blue-400 ring-2 ring-blue-200" : "border-gray-200"}`}>
      {/* Заголовок с иконкой и статусом */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isRunning ? "bg-blue-100 animate-pulse" : "bg-gray-100"}`}>
            {info.icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{info.name}</h3>
            <p className="text-xs text-gray-500">{info.description}</p>
          </div>
        </div>

        {/* Статус */}
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${isRunning ? "bg-blue-100 text-blue-700" : isPaused ? "bg-gray-100 text-gray-600" : "bg-green-100 text-green-700"}`}>
          {isRunning ? (
            <span className="flex items-center gap-1.5">
              <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 0 5.373 0 0 0 12 12c0 5.627 2.627 12 0 0 0 0 12-12z"></path>
              </svg>
              Работает сейчас
            </span>
          ) : isPaused ? (
            "Автозапуск выкл"
          ) : (
            "Активен"
          )}
        </div>
      </div>

      {/* Сообщение при работе */}
      {isRunning && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700 font-medium flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 0 5.373 0 0 0 12 12c0 5.627 2.627 12 0 0 0 0 12-12z"></path>
            </svg>
            {info.name} выполняется прямо сейчас
          </p>
        </div>
      )}

      {/* Информация о следующем автоматическом запуске */}
      {!isRunning && !isPaused && job.next_run && (
        <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Автозапуск:</span>
            <span>{formatNextRun(job.next_run)}</span>
          </div>
        </div>
      )}

      {/* Сообщение когда на паузе */}
      {isPaused && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">
            Автоматический запуск отключён. Парсер не будет запускаться по расписанию.
            Нажмите "Включить" для возобновления.
          </p>
        </div>
      )}

      {/* Кнопки управления */}
      <div className="flex gap-2">
        {isRunning ? (
          /* Когда работает прямо сейчас - кнопка остановки */
          <button
            onClick={onStop}
            disabled={isLoading}
            className="w-full px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 0 5.373 0 0 0 12 12c0 5.627 2.627 12 0 0 0 0 12-12z"></path>
                </svg>
                Остановка...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="1" />
                </svg>
                Остановить
              </>
            )}
          </button>
        ) : isPaused ? (
          /* Когда на паузе - кнопка включения автозапуска */
          <button
            onClick={onResume}
            disabled={isLoading}
            className="w-full px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            title="Включить автоматический запуск по расписанию"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Включить
          </button>
        ) : (
          /* Когда активен - две кнопки */
          <>
            <button
              onClick={onTrigger}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              title="Запустить прямо сейчас (вне расписания)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Запустить
            </button>
            <button
              onClick={onPause}
              disabled={isLoading}
              className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              title="Отключить автоматический запуск"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
              Отключить
            </button>
          </>
        )}
      </div>
    </div>
  );
}

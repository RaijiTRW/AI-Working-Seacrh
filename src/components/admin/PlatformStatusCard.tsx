"use client";

import { useState, useEffect } from "react";
import { SchedulerJobStatus } from "@/lib/api";

interface PlatformStatusCardProps {
  job: SchedulerJobStatus;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onTrigger: () => void;
  isLoading?: boolean;
}

function useCountdown(targetDate: string | null) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!targetDate) {
      setTimeLeft("--");
      return;
    }

    const updateCountdown = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Сейчас...");
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      if (h > 0) {
        setTimeLeft(`${h}ч ${m}м ${s}с`);
      } else if (m > 0) {
        setTimeLeft(`${m}м ${s}с`);
      } else {
        setTimeLeft(`${s}с`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "--";
  if (seconds < 60) return `${Math.round(seconds)}с`;
  const minutes = Math.round(seconds / 60 * 10) / 10;
  return `${minutes} мин`;
}

const JOB_ICONS: Record<string, string> = {
  mass_parsing_job: "📥",  // Новый массовый парсинг для ленты
  parsing_job: "HH",       // Старый (deprecated)
  avito_job: "AV",         // Отключен
  verification_job: "✓",
};

const JOB_COLORS: Record<string, string> = {
  mass_parsing_job: "purple",  // Фиолетовый для ленты
  parsing_job: "orange",
  avito_job: "blue",
  verification_job: "green",
};

const JOB_DESCRIPTIONS: Record<string, string> = {
  mass_parsing_job: "Сбор вакансий для ленты",
  parsing_job: "Старый парсинг (deprecated)",
  avito_job: "Отключен",
  verification_job: "Проверка актуальности",
};

export default function PlatformStatusCard({
  job,
  onPause,
  onResume,
  onStop,
  onTrigger,
  isLoading,
}: PlatformStatusCardProps) {
  const countdown = useCountdown(job.next_run);
  const color = JOB_COLORS[job.job_id] || "gray";

  const statusConfig = {
    active: {
      bg: "bg-green-100",
      text: "text-green-700",
      label: "Активен",
      dot: "bg-green-500",
    },
    paused: {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      label: "Пауза",
      dot: "bg-yellow-500",
    },
    running: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      label: "Работает...",
      dot: "bg-blue-500 animate-pulse",
    },
  };

  const status = statusConfig[job.status] || statusConfig.active;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
              color === "purple"
                ? "bg-purple-100 text-purple-600"
                : color === "orange"
                ? "bg-orange-100 text-orange-600"
                : color === "blue"
                ? "bg-blue-100 text-blue-600"
                : "bg-green-100 text-green-600"
            }`}
          >
            {JOB_ICONS[job.job_id] || "??"}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{job.name}</h3>
            <p className="text-xs text-gray-500">{JOB_DESCRIPTIONS[job.job_id] || ""}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-2 h-2 rounded-full ${status.dot}`} />
              <span className={`text-xs ${status.text}`}>{status.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">До запуска</span>
          <span className="text-sm font-medium text-gray-900 font-mono">
            {job.is_paused ? "--" : countdown}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Прошлый</span>
          <span className="text-sm font-medium text-gray-900">
            {formatDuration(job.last_run?.duration_seconds)}
          </span>
        </div>
        {job.last_run?.stats && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Результат</span>
            <span className="text-sm font-medium text-gray-900">
              {job.job_id === "verification_job"
                ? `${job.last_run.stats.checked || 0} проверено`
                : `${job.last_run.stats.total_saved || job.last_run.stats.saved || 0} сохранено`}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {job.status === "running" ? (
          <button
            onClick={onStop}
            disabled={isLoading}
            className="w-full px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            Остановить
          </button>
        ) : job.is_paused ? (
          <>
            <button
              onClick={onResume}
              disabled={isLoading}
              className="flex-1 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
            >
              Старт
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onPause}
              disabled={isLoading}
              className="flex-1 px-3 py-2 text-sm font-medium text-yellow-700 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors disabled:opacity-50"
            >
              Стоп
            </button>
            <button
              onClick={onTrigger}
              disabled={isLoading}
              className="flex-1 px-3 py-2 text-sm font-medium text-orange-700 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-50"
            >
              Запуск
            </button>
          </>
        )}
      </div>
    </div>
  );
}

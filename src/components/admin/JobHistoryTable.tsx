"use client";

import { JobHistoryItem } from "@/lib/api";

interface JobHistoryTableProps {
  history: JobHistoryItem[];
  isLoading?: boolean;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "--";
  if (seconds < 60) return `${Math.round(seconds)}с`;
  const minutes = Math.round(seconds / 60 * 10) / 10;
  return `${minutes} мин`;
}

const JOB_NAMES: Record<string, string> = {
  parsing_job: "HH/SuperJob",
  avito_job: "Avito",
  verification_job: "Верификация",
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  completed: {
    bg: "bg-green-100",
    text: "text-green-700",
    label: "OK",
  },
  completed_with_errors: {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    label: "С ошибками",
  },
  failed: {
    bg: "bg-red-100",
    text: "text-red-700",
    label: "Ошибка",
  },
  skipped: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    label: "Пропущен",
  },
};

function getStats(item: JobHistoryItem): string {
  const stats = item.stats as Record<string, unknown>;

  if (item.job_id === "verification_job") {
    const checked = stats.checked || 0;
    const inactive = stats.marked_inactive || 0;
    return `${checked} / ${inactive}`;
  }

  const saved = stats.total_saved || stats.saved || 0;
  const parsed = stats.parsed ||
    ((stats.hh as Record<string, number>)?.parsed || 0) +
    ((stats.superjob as Record<string, number>)?.parsed || 0);
  return `${parsed} / ${saved}`;
}

export default function JobHistoryTable({ history, isLoading }: JobHistoryTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-4">История выполнения</h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-4">История выполнения</h3>
        <p className="text-gray-500 text-sm text-center py-8">
          Нет данных о выполнении
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">История выполнения</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-2 text-left">Платформа</th>
              <th className="px-4 py-2 text-left">Статус</th>
              <th className="px-4 py-2 text-left">Время</th>
              <th className="px-4 py-2 text-left">Длительность</th>
              <th className="px-4 py-2 text-left">Результат</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {history.slice(0, 10).map((item) => {
              const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.completed;
              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-sm font-medium text-gray-900">
                    {JOB_NAMES[item.job_id] || item.job_name}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig.bg} ${statusConfig.text}`}
                    >
                      {statusConfig.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-sm text-gray-600">
                    {formatDate(item.started_at)}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-gray-600">
                    {formatDuration(item.duration_seconds)}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-gray-600 font-mono">
                    {getStats(item)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

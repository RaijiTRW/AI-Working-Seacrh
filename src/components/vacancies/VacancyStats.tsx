"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getVacancyStats, VacancyStats as VacancyStatsType } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

interface VacancyStatsProps {
  total: number;
  activeSource?: string | null;
  onSourceFilter: (source: string | null) => void;
}

export default function VacancyStats({ total, activeSource, onSourceFilter }: VacancyStatsProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<VacancyStatsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getVacancyStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const handleSourceClick = (source: string | null) => {
    // Toggle if same source clicked
    if (activeSource === source) {
      onSourceFilter(null);
    } else {
      onSourceFilter(source);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 mb-4 sm:mb-6">
      {/* Title */}
      <p className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
        Найдено {total.toLocaleString("ru-RU")} вакансий
      </p>

      {/* Source filters */}
      {loading ? (
        <div className="flex gap-2 sm:gap-3 mb-4">
          <div className="h-8 w-20 sm:w-24 bg-gray-100 rounded-full animate-pulse" />
          <div className="h-8 w-24 sm:w-28 bg-gray-100 rounded-full animate-pulse" />
          <div className="h-8 w-20 sm:w-24 bg-gray-100 rounded-full animate-pulse" />
        </div>
      ) : stats ? (
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
          {/* Platform (Наши) */}
          <button
            onClick={() => handleSourceClick("platform")}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeSource === "platform"
                ? "bg-orange-500 text-white ring-2 ring-orange-300"
                : "bg-orange-100 text-orange-700 hover:bg-orange-200"
            }`}
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Наши: {stats.platform.toLocaleString("ru-RU")}
          </button>

          {/* Network (В сети) */}
          <button
            onClick={() => handleSourceClick("network")}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeSource === "network"
                ? "bg-blue-500 text-white ring-2 ring-blue-300"
                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
            }`}
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            В сети: {stats.network.toLocaleString("ru-RU")}
          </button>

          {/* Total (Всего) */}
          <button
            onClick={() => handleSourceClick(null)}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeSource === null
                ? "bg-gray-700 text-white ring-2 ring-gray-400"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Всего: {stats.total.toLocaleString("ru-RU")}
          </button>
        </div>
      ) : null}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        {user && (
          <Link
            href="/vacancies/my"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Мои вакансии
          </Link>
        )}

        {user ? (
          <Link
            href="/vacancies/create"
            className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-xl hover:bg-orange-600 transition-colors"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Создать вакансию
          </Link>
        ) : (
          <Link
            href="/auth"
            className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Войти для публикации
          </Link>
        )}
      </div>
    </div>
  );
}

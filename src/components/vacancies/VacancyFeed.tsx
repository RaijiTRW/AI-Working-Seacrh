"use client";

import { useState } from "react";
import VacancyListCard, { Vacancy } from "./VacancyListCard";
import Link from "next/link";

interface VacancyFeedProps {
  vacancies: Vacancy[];
  loading?: boolean;
  query?: string;
  total?: number;
  hasNext?: boolean;
  onLoadMore?: () => void;
  currentUserId?: string;
}

type SortOption = "relevance" | "date" | "salary_desc" | "salary_asc";

export default function VacancyFeed({
  vacancies,
  loading,
  query,
  total,
  hasNext,
  onLoadMore,
  currentUserId,
}: VacancyFeedProps) {
  const [sortBy, setSortBy] = useState<SortOption>("relevance");

  const sortOptions = [
    { value: "relevance", label: "По соответствию" },
    { value: "date", label: "По дате" },
    { value: "salary_desc", label: "По убыванию зарплаты" },
    { value: "salary_asc", label: "По возрастанию зарплаты" },
  ];

  // Sort vacancies (client-side for now)
  const sortedVacancies = [...vacancies].sort((a, b) => {
    switch (sortBy) {
      case "salary_desc":
        return (b.salary_from || 0) - (a.salary_from || 0);
      case "salary_asc":
        return (a.salary_from || 0) - (b.salary_from || 0);
      default:
        return 0;
    }
  });

  // Loading skeleton
  if (loading && vacancies.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-3" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
            <div className="flex gap-3">
              <div className="h-10 bg-gray-200 rounded w-32" />
              <div className="h-10 bg-gray-200 rounded w-28" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (vacancies.length === 0 && !loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {query ? "Ничего не найдено" : "Вакансии загружаются"}
        </h3>
        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
          {query
            ? "Попробуйте изменить запрос или фильтры"
            : "Система собирает вакансии со всех площадок. Попробуйте обновить страницу позже или воспользуйтесь AI-поиском"}
        </p>
        <Link
          href="/chat"
          className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          Попробовать AI-поиск
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Найдено {total || vacancies.length} вакансий
            {query && <span className="text-gray-500 font-normal"> по запросу «{query}»</span>}
          </h2>
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Vacancy list */}
      <div className="space-y-4">
        {sortedVacancies.map((vacancy) => (
          <VacancyListCard key={vacancy.id} vacancy={vacancy} currentUserId={currentUserId} />
        ))}
      </div>

      {/* Load more button */}
      {hasNext && (
        <div className="mt-6 text-center">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="px-8 py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {loading ? "Загрузка..." : "Показать ещё"}
          </button>
        </div>
      )}

      {/* Loading more indicator */}
      {loading && vacancies.length > 0 && (
        <div className="mt-4 flex justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}

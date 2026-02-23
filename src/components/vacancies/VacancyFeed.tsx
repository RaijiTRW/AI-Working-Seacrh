"use client";

import { useState } from "react";
import VacancyListCard, { Vacancy } from "./VacancyListCard";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

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
    { value: "salary_desc", label: "По убыванию ↓" },
    { value: "salary_asc", label: "По возрастанию ↑" },
  ];

  // Sort vacancies (client-side for now)
  // Note: Date sorting should ideally be done on backend for proper pagination
  const sortedVacancies = [...vacancies].sort((a, b) => {
    switch (sortBy) {
      case "salary_desc":
        return (b.salary_from || 0) - (a.salary_from || 0);
      case "salary_asc":
        return (a.salary_from || 0) - (b.salary_from || 0);
      case "date":
        // Use published_at timestamp for proper date sorting
        const aDate = new Date(a.published_at || a.created_at || 0);
        const bDate = new Date(b.published_at || b.created_at || 0);
        return bDate.getTime() - aDate.getTime(); // Newest first
      default:
        return 0;
    }
  });

  // Loading skeleton for initial load or filter change
  const showInitialSkeleton = loading && vacancies.length === 0;
  const showFilterOverlay = loading && vacancies.length > 0;

  if (showInitialSkeleton) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#1f2833]/40 backdrop-blur-md rounded-2xl border border-[#c5c6c7]/10 p-5 shadow-sm overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#c5c6c7]/5 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
            <div className="h-6 bg-[#c5c6c7]/10 rounded-md w-3/4 mb-3 animate-pulse" />
            <div className="h-4 bg-[#c5c6c7]/5 rounded-md w-24 mb-4 animate-pulse relative z-10" />
            <div className="h-8 bg-[#00f0ff]/10 rounded-md w-1/3 mb-4 animate-pulse relative z-10" />
            <div className="flex items-center gap-3 mb-4">
              <div className="h-4 bg-[#c5c6c7]/5 rounded-md w-32 animate-pulse relative z-10" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#c5c6c7]/10" />
              <div className="h-4 bg-[#c5c6c7]/5 rounded-md w-24 animate-pulse relative z-10" />
            </div>
            <div className="space-y-2 mb-6">
              <div className="h-3 bg-[#c5c6c7]/5 rounded w-full animate-pulse relative z-10" />
              <div className="h-3 bg-[#c5c6c7]/5 rounded w-5/6 animate-pulse relative z-10" />
            </div>
            <div className="flex gap-3 pt-4 border-t border-[#c5c6c7]/5 relative z-10">
              <div className="h-10 bg-[#c5c6c7]/10 rounded-lg w-32 animate-pulse" />
              <div className="h-10 bg-[#c5c6c7]/5 rounded-lg w-28 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (vacancies.length === 0 && !loading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#1f2833]/40 backdrop-blur-md rounded-2xl border border-[#c5c6c7]/10 p-8 text-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10 pointer-events-none" />
        <div className="w-20 h-20 mx-auto mb-6 bg-[#00f0ff]/10 border border-[#00f0ff]/30 shadow-[0_0_20px_rgba(0,240,255,0.2)] rounded-full flex flex-col items-center justify-center relative">
          <div className="absolute inset-0 rounded-full border border-[#00f0ff]/20 animate-ping opacity-50" />
          <svg className="w-10 h-10 text-[#00f0ff] relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-black text-white mb-2 tracking-wide relative z-10 drop-shadow-sm">
          {query ? "Ничего не найдено" : "ИИ анализирует рынок"}
        </h3>
        <p className="text-[#c5c6c7]/60 mb-8 max-w-sm mx-auto text-sm leading-relaxed relative z-10">
          {query
            ? "Попробуйте изменить запрос, убрать фильтры или использовать нейросетевой поиск по резюме."
            : "Система собирает подходящие вакансии со всех площадок. Попробуйте обновить страницу позже или обратитесь к ИИ-ассистенту."}
        </p>
        <Link
          href="/chat"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] text-[#0b0c10] text-sm font-black uppercase tracking-widest rounded-xl hover:shadow-[0_0_25px_rgba(255,107,0,0.5)] transition-all hover:scale-[1.02] relative z-10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          ИИ-Поиск работы
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 sm:mb-6 gap-3 sm:gap-4 relative z-20">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[#c5c6c7]/60 truncate">
            {query && <span className="text-[#00f0ff] mr-2">«{query}»</span>}
          </p>
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none pl-4 pr-10 py-2 min-h-10 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#c5c6c7] bg-[#0b0c10]/80 backdrop-blur-md border border-[#c5c6c7]/20 rounded-xl focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] shadow-sm transition-all"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-[#1f2833] text-white">
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[#c5c6c7]/50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Vacancy list */}
      <div className="space-y-4 relative">
        <AnimatePresence>
          {showFilterOverlay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0b0c10]/70 backdrop-blur-sm z-30 flex items-center justify-center rounded-2xl border border-[#c5c6c7]/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
            >
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 border-4 border-[#00f0ff]/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-[#00f0ff] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(0,240,255,0.5)]" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {sortedVacancies.map((vacancy) => (
          <VacancyListCard key={vacancy.id} vacancy={vacancy} currentUserId={currentUserId} />
        ))}
      </div>

      {/* Load more button */}
      {hasNext && (
        <div className="mt-8 text-center">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="group px-8 py-3 min-h-[48px] bg-[#00f0ff]/5 border border-[#00f0ff]/30 text-[#00f0ff] text-sm uppercase tracking-widest font-black rounded-xl hover:bg-[#00f0ff]/10 hover:border-[#00f0ff]/50 hover:shadow-[0_0_20px_rgba(0,240,255,0.2)] transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00f0ff]/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#00f0ff]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Синтез данных...
                </>
              ) : (
                "Загрузить ещё нейро-результаты"
              )}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getVacancyStats, VacancyStats as VacancyStatsType } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";
import { motion } from "framer-motion";

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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1f2833]/40 backdrop-blur-md rounded-2xl border border-[#c5c6c7]/10 p-5 mb-6 shadow-[0_5px_20px_rgba(0,0,0,0.3)] relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#ff6b00]/5 to-transparent rounded-bl-full pointer-events-none" />

      {/* Title */}
      <h2 className="text-lg font-black text-white mb-4 drop-shadow-sm flex items-center gap-2 relative z-10">
        <span className="w-2 h-2 rounded-full bg-[#00f0ff] shadow-[0_0_8px_rgba(0,240,255,0.8)] animate-pulse" />
        Найдено {total.toLocaleString("ru-RU")} вакансий
      </h2>

      {/* Source filters */}
      {loading ? (
        <div className="flex gap-3 mb-5 overflow-x-auto pb-2 scrollbar-hide">
          <div className="h-9 w-24 bg-[#c5c6c7]/5 rounded-full animate-pulse shrink-0 border border-[#c5c6c7]/10" />
          <div className="h-9 w-28 bg-[#c5c6c7]/5 rounded-full animate-pulse shrink-0 border border-[#c5c6c7]/10" />
          <div className="h-9 w-24 bg-[#c5c6c7]/5 rounded-full animate-pulse shrink-0 border border-[#c5c6c7]/10" />
        </div>
      ) : stats ? (
        <div className="flex overflow-x-auto gap-3 mb-5 pb-2 scrollbar-thin scrollbar-thumb-[#0b0c10] scrollbar-track-transparent -mx-1 px-1 sm:mx-0 sm:px-0 relative z-10">
          {/* Platform (Наши) */}
          <button
            onClick={() => handleSourceClick("platform")}
            className={`flex items-center gap-2 px-4 py-1.5 min-h-[38px] rounded-full text-xs font-black uppercase tracking-widest transition-all shrink-0 whitespace-nowrap border ${activeSource === "platform"
                ? "bg-[#ff6b00]/20 text-[#ff6b00] border-[#ff6b00]/60 shadow-[0_0_15px_rgba(255,107,0,0.4)]"
                : "bg-[#ff6b00]/5 text-[#ff6b00]/70 border-[#ff6b00]/20 hover:bg-[#ff6b00]/10 hover:border-[#ff6b00]/40"
              }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Наши: {stats.platform.toLocaleString("ru-RU")}
          </button>

          {/* Network (В сети) */}
          <button
            onClick={() => handleSourceClick("network")}
            className={`flex items-center gap-2 px-4 py-1.5 min-h-[38px] rounded-full text-xs font-black uppercase tracking-widest transition-all shrink-0 whitespace-nowrap border ${activeSource === "network"
                ? "bg-[#00f0ff]/20 text-[#00f0ff] border-[#00f0ff]/60 shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                : "bg-[#00f0ff]/5 text-[#00f0ff]/70 border-[#00f0ff]/20 hover:bg-[#00f0ff]/10 hover:border-[#00f0ff]/40"
              }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            В сети: {stats.network.toLocaleString("ru-RU")}
          </button>

          {/* Total (Всего) */}
          <button
            onClick={() => handleSourceClick(null)}
            className={`flex items-center gap-2 px-4 py-1.5 min-h-[38px] rounded-full text-xs font-black uppercase tracking-widest transition-all shrink-0 whitespace-nowrap border ${activeSource === null
                ? "bg-[#c5c6c7]/20 text-white border-[#c5c6c7]/40 shadow-inner"
                : "bg-[#c5c6c7]/5 text-[#c5c6c7]/50 border-[#c5c6c7]/10 hover:bg-[#c5c6c7]/10 hover:text-[#c5c6c7]"
              }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Всего: {stats.total.toLocaleString("ru-RU")}
          </button>
        </div>
      ) : null}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#c5c6c7]/5 relative z-10">
        {user && (
          <Link
            href="/vacancies/my"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 min-h-11 border border-[#c5c6c7]/20 text-[#c5c6c7] text-xs uppercase tracking-widest font-black rounded-xl hover:bg-[#c5c6c7]/10 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Мои вакансии
          </Link>
        )}

        {user ? (
          <Link
            href="/vacancies/create"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 min-h-11 bg-gradient-to-r from-[#00f0ff] to-[#00c0cc] text-[#0b0c10] text-xs uppercase tracking-widest font-black rounded-xl hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all hover:scale-[1.02]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Создать вакансию
          </Link>
        ) : (
          <Link
            href="/auth"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 min-h-11 bg-[#c5c6c7]/10 border border-[#c5c6c7]/20 text-[#c5c6c7]/80 text-xs uppercase tracking-widest font-black rounded-xl hover:bg-[#c5c6c7]/20 hover:text-white transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Войти для публикации
          </Link>
        )}
      </div>
    </motion.div>
  );
}

"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface Vacancy {
  id: string;
  title: string;
  company: string;
  salary_from?: number;
  salary_to?: number;
  city: string;
  experience?: string;
  employment_type?: string;
  description: string;
  url: string;
  source: string;
  fit_status?: "fit" | "partial" | "reject" | "unknown";
  fit_score?: number;
  fit_confidence?: number;
  matched_reasons?: string[];
  mismatch_reasons?: string[];
}

interface VacancyCardsProps {
  vacancies: Vacancy[];
  rejectedVacancies?: Vacancy[];
}

function formatSalary(from?: number, to?: number): string {
  if (from && to) {
    return `${from.toLocaleString("ru-RU")} - ${to.toLocaleString("ru-RU")} \u20BD`;
  }
  if (from) {
    return `от ${from.toLocaleString("ru-RU")} \u20BD`;
  }
  if (to) {
    return `до ${to.toLocaleString("ru-RU")} \u20BD`;
  }
  return "Не указана";
}

function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    hh: "hh.ru",
    avito: "Avito",
    superjob: "SuperJob",
  };
  return labels[source] || source;
}

function getSourceColor(source: string): string {
  const colors: Record<string, string> = {
    hh: "bg-red-500/20 text-red-400 border border-red-500/30",
    avito: "bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/30",
    superjob: "bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30",
  };
  return colors[source] || "bg-[#c5c6c7]/10 text-[#c5c6c7]/80 border border-[#c5c6c7]/20";
}

function getFitBadge(vacancy: Vacancy): { label: string; className: string } | null {
  if (!vacancy.fit_status) return null;

  const scoreText = typeof vacancy.fit_score === "number" ? ` ${vacancy.fit_score}%` : "";
  switch (vacancy.fit_status) {
    case "fit":
      return {
        label: `Подходит${scoreText}`,
        className: "bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/40 shadow-[0_0_10px_rgba(0,255,136,0.2)]",
      };
    case "partial":
      return {
        label: `Частично${scoreText}`,
        className: "bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]",
      };
    case "reject":
      return {
        label: "Не подходит",
        className: "bg-red-500/20 text-red-400 border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)]",
      };
    case "unknown":
      return {
        label: "Неясно",
        className: "bg-[#c5c6c7]/10 text-[#c5c6c7] border border-[#c5c6c7]/20",
      };
    default:
      return null;
  }
}

function VacancyCard({ vacancy }: { vacancy: Vacancy }) {
  const fitBadge = getFitBadge(vacancy);
  const matchedReasons = (vacancy.matched_reasons || []).slice(0, 2);
  const mismatchReasons = (vacancy.mismatch_reasons || []).slice(0, 2);

  return (
    <motion.a
      href={vacancy.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-shrink-0 w-80 bg-[#1f2833]/60 backdrop-blur-md rounded-2xl border border-[#c5c6c7]/10 p-5 hover:border-[#ff6b00]/50 hover:shadow-[0_0_30px_rgba(255,107,0,0.15)] transition-all duration-300 group/vacancy flex flex-col relative overflow-hidden"
      whileHover={{ y: -5, scale: 1.02 }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#ff6b00]/10 to-transparent opacity-0 group-hover/vacancy:opacity-100 transition-opacity duration-500 rounded-bl-full pointer-events-none" />

      {/* Source badge */}
      <div className="flex items-start justify-between gap-2 mb-4 relative z-10">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded shadow-sm ${getSourceColor(vacancy.source)}`}>
            {getSourceLabel(vacancy.source)}
          </span>
          {fitBadge && (
            <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded shadow-sm ${fitBadge.className}`}>
              {fitBadge.label}
            </span>
          )}
        </div>
        {vacancy.employment_type === "remote" && (
          <span className="text-[10px] uppercase tracking-wider font-bold text-[#00f0ff] bg-[#00f0ff]/10 border border-[#00f0ff]/30 px-2 py-1 rounded shadow-[0_0_10px_rgba(0,240,255,0.2)]">Удалённо</span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-bold text-lg text-white mb-1.5 leading-snug line-clamp-2 group-hover/vacancy:text-[#ff6b00] transition-colors relative z-10">
        {vacancy.title}
      </h3>

      {/* Company */}
      <p className="text-sm text-[#c5c6c7]/80 mb-4 truncate font-medium relative z-10">{vacancy.company}</p>

      {/* Salary */}
      <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#00c0cc] mb-3 drop-shadow-[0_0_10px_rgba(0,240,255,0.3)] relative z-10">
        {formatSalary(vacancy.salary_from, vacancy.salary_to)}
      </p>

      {/* City & Experience */}
      <div className="flex items-center gap-2 text-xs text-[#c5c6c7]/60 font-medium mb-3 relative z-10">
        <span>{vacancy.city}</span>
        {vacancy.experience && (
          <>
            <span className="text-[#ff6b00]">\u2022</span>
            <span>{vacancy.experience}</span>
          </>
        )}
      </div>

      {/* Description preview */}
      {vacancy.description && (
        <p className="text-xs text-[#c5c6c7]/60 line-clamp-3 leading-relaxed relative z-10 flex-grow">
          {vacancy.description}
        </p>
      )}

      {(matchedReasons.length > 0 || mismatchReasons.length > 0) && (
        <div className="mt-4 space-y-2 relative z-10">
          {matchedReasons.map((reason) => (
            <div key={`m-${reason}`} className="flex items-start gap-1.5 bg-[#00ff88]/5 border border-[#00ff88]/20 rounded-lg p-2">
              <svg className="w-3.5 h-3.5 text-[#00ff88] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              <p className="text-[11px] leading-tight text-[#c5c6c7]/90 line-clamp-2">{reason}</p>
            </div>
          ))}
          {mismatchReasons.map((reason) => (
            <div key={`x-${reason}`} className="flex items-start gap-1.5 bg-red-500/5 border border-red-500/20 rounded-lg p-2">
              <svg className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              <p className="text-[11px] leading-tight text-[#c5c6c7]/90 line-clamp-2">{reason}</p>
            </div>
          ))}
        </div>
      )}

      {/* Arrow */}
      <div className="mt-4 flex items-center justify-between pt-3 border-t border-[#c5c6c7]/5 relative z-10">
        <span className="text-[10px] text-[#c5c6c7]/40 uppercase tracking-widest font-bold">Найдено JobAISearch</span>
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#ff6b00] opacity-0 group-hover/vacancy:opacity-100 transition-opacity translate-x-2 group-hover/vacancy:translate-x-0 duration-300">
          Открыть
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </motion.a>
  );
}

function VacancyCarousel({ vacancies, className = "" }: { vacancies: Vacancy[]; className?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener("scroll", checkScroll);
      return () => ref.removeEventListener("scroll", checkScroll);
    }
  }, [vacancies]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 340;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (vacancies.length === 0) return null;

  return (
    <div className={`relative ${className}`}>
      {/* Scroll buttons */}
      <AnimatePresence>
        {canScrollLeft && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-[#0b0c10]/80 backdrop-blur-md rounded-full shadow-[0_0_20px_rgba(0,0,0,0.8)] border border-[#ff6b00]/30 flex items-center justify-center hover:bg-[#ff6b00]/20 hover:border-[#ff6b00] transition-colors"
          >
            <svg className="w-6 h-6 text-[#ff6b00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {canScrollRight && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-[#0b0c10]/80 backdrop-blur-md rounded-full shadow-[0_0_20px_rgba(0,0,0,0.8)] border border-[#ff6b00]/30 flex items-center justify-center hover:bg-[#ff6b00]/20 hover:border-[#ff6b00] transition-colors"
          >
            <svg className="w-6 h-6 text-[#ff6b00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Cards container */}
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto scrollbar-hide px-2 py-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {vacancies.map((vacancy) => (
          <VacancyCard key={vacancy.id} vacancy={vacancy} />
        ))}
      </div>

      {/* Gradient edges */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#0b0c10] to-transparent pointer-events-none z-10" />
      )}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0b0c10] to-transparent pointer-events-none z-10" />
      )}
    </div>
  );
}

export default function VacancyCards({ vacancies, rejectedVacancies }: VacancyCardsProps) {
  const [showRejected, setShowRejected] = useState(false);

  if (vacancies.length === 0) return null;

  const hasRejected = rejectedVacancies && rejectedVacancies.length > 0;

  return (
    <div className="mt-6">
      {/* Main vacancies */}
      <VacancyCarousel vacancies={vacancies} />

      {/* Show all button */}
      {hasRejected && (
        <div className="mt-6 flex justify-center relative z-10">
          <button
            onClick={() => setShowRejected(!showRejected)}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-[#c5c6c7] border border-[#c5c6c7]/20 hover:border-[#00f0ff]/50 hover:text-[#00f0ff] hover:bg-[#00f0ff]/10 rounded-xl transition-all shadow-sm"
          >
            {showRejected ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                Скрыть остальные ({rejectedVacancies.length})
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Показать отсеянные ({rejectedVacancies.length})
              </>
            )}
          </button>
        </div>
      )}

      {/* Rejected vacancies */}
      <AnimatePresence>
        {showRejected && hasRejected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-red-500/30" />
              <span className="text-[10px] text-red-400 uppercase tracking-widest font-black flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Отсеянные вакансии
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-red-500/30" />
            </div>
            <VacancyCarousel vacancies={rejectedVacancies} className="opacity-75 hover:opacity-100 transition-opacity duration-300 grayscale-[0.3]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { useRef, useState, useEffect } from "react";

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
}

interface VacancyCardsProps {
  vacancies: Vacancy[];
  rejectedVacancies?: Vacancy[];
}

function formatSalary(from?: number, to?: number): string {
  if (from && to) {
    return `${from.toLocaleString("ru-RU")} - ${to.toLocaleString("ru-RU")} ₽`;
  }
  if (from) {
    return `от ${from.toLocaleString("ru-RU")} ₽`;
  }
  if (to) {
    return `до ${to.toLocaleString("ru-RU")} ₽`;
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
    hh: "bg-red-100 text-red-600",
    avito: "bg-green-100 text-green-600",
    superjob: "bg-blue-100 text-blue-600",
  };
  return colors[source] || "bg-gray-100 text-gray-600";
}

function VacancyCard({ vacancy }: { vacancy: Vacancy }) {
  return (
    <a
      href={vacancy.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-shrink-0 w-72 bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-lg hover:border-orange-200 transition-all duration-200 group"
    >
      {/* Source badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getSourceColor(vacancy.source)}`}>
          {getSourceLabel(vacancy.source)}
        </span>
        {vacancy.employment_type === "remote" && (
          <span className="text-xs text-gray-500">Удалённо</span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-orange-600 transition-colors">
        {vacancy.title}
      </h3>

      {/* Company */}
      <p className="text-sm text-gray-500 mb-3 truncate">{vacancy.company}</p>

      {/* Salary */}
      <p className="text-lg font-bold text-orange-500 mb-2">
        {formatSalary(vacancy.salary_from, vacancy.salary_to)}
      </p>

      {/* City & Experience */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span>{vacancy.city}</span>
        {vacancy.experience && (
          <>
            <span>•</span>
            <span>{vacancy.experience}</span>
          </>
        )}
      </div>

      {/* Description preview */}
      {vacancy.description && (
        <p className="mt-3 text-xs text-gray-500 line-clamp-2">
          {vacancy.description}
        </p>
      )}

      {/* Arrow */}
      <div className="mt-3 flex items-center gap-1 text-xs font-medium text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity">
        Открыть
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </a>
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
    const amount = 300;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (vacancies.length === 0) return null;

  return (
    <div className={`relative ${className}`}>
      {/* Scroll buttons */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Cards container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide px-1 py-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {vacancies.map((vacancy) => (
          <VacancyCard key={vacancy.id} vacancy={vacancy} />
        ))}
      </div>

      {/* Gradient edges */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-50 to-transparent pointer-events-none" />
      )}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none" />
      )}
    </div>
  );
}

export default function VacancyCards({ vacancies, rejectedVacancies }: VacancyCardsProps) {
  const [showRejected, setShowRejected] = useState(false);

  if (vacancies.length === 0) return null;

  const hasRejected = rejectedVacancies && rejectedVacancies.length > 0;

  return (
    <div className="mt-4">
      {/* Main vacancies */}
      <VacancyCarousel vacancies={vacancies} />

      {/* Show all button */}
      {hasRejected && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setShowRejected(!showRejected)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
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
                Показать все ({rejectedVacancies.length} отсеянных)
              </>
            )}
          </button>
        </div>
      )}

      {/* Rejected vacancies */}
      {showRejected && hasRejected && (
        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400 uppercase tracking-wide">Отсеянные вакансии</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          <VacancyCarousel vacancies={rejectedVacancies} className="opacity-75" />
        </div>
      )}
    </div>
  );
}

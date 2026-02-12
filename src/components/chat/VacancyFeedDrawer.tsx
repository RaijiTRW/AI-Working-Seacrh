"use client";

import { useEffect } from "react";
import VacancyListCard, { Vacancy } from "@/components/vacancies/VacancyListCard";

export interface VacancyGroup {
  query: string;
  vacancies: Vacancy[];
}

interface VacancyFeedDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  groups: VacancyGroup[];
  isLoading?: boolean;
}

export default function VacancyFeedDrawer({
  isOpen,
  onClose,
  groups,
  isLoading = false,
}: VacancyFeedDrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const allVacancies = groups.flatMap((g) => g.vacancies);
  const hasContent = allVacancies.length > 0 || isLoading;

  const renderGroups = () => {
    if (!hasContent) {
      return (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">Вакансии появятся здесь</p>
        </div>
      );
    }

    return (
      <div className="p-4">
        {groups.map((group, groupIndex) => {
          if (group.vacancies.length === 0) return null;

          return (
            <div key={groupIndex} className="mb-6 last:mb-0">
              {groupIndex > 0 && (
                <div className="flex items-center gap-3 my-4">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {group.query}
                  </span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
              )}
              {groupIndex === 0 && (
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                  {group.query}
                </div>
              )}
              <div className="space-y-3">
                {group.vacancies.map((vacancy) => (
                  <VacancyListCard key={vacancy.id} vacancy={vacancy} />
                ))}
              </div>
            </div>
          );
        })}
        {isLoading && allVacancies.length > 0 && (
          <div className="flex justify-center py-4">
            <div className="animate-spin w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full" />
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="hidden lg:block fixed right-0 top-16 h-[calc(100dvh-4rem)] w-96 bg-white border-l border-gray-200 z-30 shadow-xl animate-in slide-in-from-right-4 duration-300">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <h3 className="font-semibold text-gray-900">Лента вакансий</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Закрыть">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-60px)]">
          {renderGroups()}
        </div>
      </div>

      <div className="lg:hidden fixed inset-0 z-40 animate-in fade-in duration-200">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="absolute inset-0 bg-white animate-in slide-in-from-right duration-300 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <h3 className="font-semibold text-gray-900">Лента вакансий</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Закрыть">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {renderGroups()}
          </div>
        </div>
      </div>
    </>
  );
}

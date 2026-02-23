"use client";

import { useEffect } from "react";
import VacancyListCard, { Vacancy } from "@/components/vacancies/VacancyListCard";
import { motion, AnimatePresence } from "framer-motion";

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

  const allVacancies = groups.flatMap((g) => g.vacancies);
  const hasContent = allVacancies.length > 0 || isLoading;

  const renderGroups = () => {
    if (!hasContent) {
      return (
        <div className="text-center py-20 px-8 flex flex-col items-center justify-center h-full">
          <div className="w-16 h-16 bg-[#1f2833] rounded-full flex items-center justify-center mb-4 border border-[#c5c6c7]/10 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <svg className="w-8 h-8 text-[#00f0ff] opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-[#c5c6c7]/60 text-sm font-medium">Лента вакансий пуста.</p>
          <p className="text-[#c5c6c7]/40 text-xs mt-2">Запросите поиск у ассистента, чтобы наполнить ленту.</p>
        </div>
      );
    }

    return (
      <div className="p-4 sm:p-6 pb-32">
        {groups.map((group, groupIndex) => {
          if (group.vacancies.length === 0) return null;

          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.1 }}
              key={groupIndex}
              className="mb-8 last:mb-0"
            >
              {groupIndex > 0 && (
                <div className="flex items-center gap-4 my-6">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#ff6b00]/30 to-transparent" />
                  <span className="text-[10px] font-black text-[#ff6b00] uppercase tracking-widest drop-shadow-[0_0_8px_rgba(255,107,0,0.5)]">
                    {group.query}
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#ff6b00]/30 to-transparent" />
                </div>
              )}
              {groupIndex === 0 && (
                <div className="text-[10px] font-black text-[#ff6b00] uppercase tracking-widest mb-4 flex items-center gap-2 drop-shadow-[0_0_8px_rgba(255,107,0,0.5)]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#ff6b00]" />
                  {group.query}
                </div>
              )}
              <div className="space-y-4">
                {group.vacancies.map((vacancy) => (
                  <VacancyListCard key={vacancy.id} vacancy={vacancy} />
                ))}
              </div>
            </motion.div>
          );
        })}
        {isLoading && allVacancies.length > 0 && (
          <div className="flex justify-center py-8">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 border-2 border-[#00f0ff]/20 rounded-full" />
              <div className="absolute inset-0 border-2 border-[#00f0ff] border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Desktop Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="hidden lg:block fixed right-0 top-[64px] h-[calc(100dvh-64px)] w-[400px] xl:w-[450px] bg-[#0b0c10]/95 backdrop-blur-3xl border-l border-[#c5c6c7]/10 z-30 shadow-[-20px_0_50px_rgba(0,0,0,0.8)]"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#c5c6c7]/10 sticky top-0 bg-[#0b0c10]/90 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1f2833] to-[#0b0c10] border border-[#00f0ff]/30 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                  <svg className="w-4 h-4 text-[#00f0ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm tracking-wide">Лента вакансий</h3>
                  <p className="text-[10px] text-[#c5c6c7]/50 uppercase tracking-widest font-medium mt-0.5">JobAISearch Feed</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-[#1f2833] text-[#c5c6c7]/60 hover:text-white rounded-lg transition-colors border border-transparent hover:border-[#c5c6c7]/20" title="Закрыть ленту">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto h-[calc(100%-73px)] scrollbar-thin scrollbar-thumb-[#1f2833] scrollbar-track-transparent">
              {renderGroups()}
            </div>
          </motion.div>

          {/* Mobile Drawer */}
          <div className="lg:hidden fixed inset-0 z-50">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0b0c10]/80 backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute inset-y-0 right-0 w-[85vw] sm:w-[350px] bg-[#0b0c10]/95 backdrop-blur-3xl border-l border-[#c5c6c7]/10 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#c5c6c7]/10 shrink-0 bg-[#0b0c10] relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1f2833] to-[#0b0c10] border border-[#00f0ff]/30 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                    <svg className="w-4 h-4 text-[#00f0ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-white text-sm">Лента вакансий</h3>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-[#1f2833] text-[#c5c6c7]/60 hover:text-white rounded-lg transition-colors border border-transparent hover:border-[#c5c6c7]/20">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#1f2833] scrollbar-track-transparent">
                {renderGroups()}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";

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
  user_id?: string;
  created_at?: string;
  published_at?: string;
}

interface VacancyListCardProps {
  vacancy: Vacancy;
  currentUserId?: string;
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
  return "";
}

function formatExperience(experience?: string): string | null {
  if (!experience) return null;

  const experienceMap: Record<string, string> = {
    "no_experience": "Без опыта",
    "noexperience": "Без опыта",
    "1-3": "1-3 года",
    "3-6": "3-6 лет",
    "6+": "Более 6 лет",
    "between1and3": "1-3 года",
    "between3and6": "3-6 лет",
    "morethan6": "Более 6 лет",
  };

  // Check for exact match first
  if (experienceMap[experience]) {
    return experienceMap[experience];
  }

  // Check for Russian text patterns - return as is if it's already in Russian
  const russianPatterns = ["без опыта", "не требуется", "нет опыта", "от 1 до 3", "от 3 до 6", "более 6", "1-3 года", "3-6 лет"];
  const lowerExp = experience.toLowerCase();
  if (russianPatterns.some(pattern => lowerExp.includes(pattern))) {
    return experience; // Return original as it's already in Russian
  }

  // If no match, return null to hide the badge
  return null;
}

function getSourceLabel(source: string, isOwner: boolean): string {
  if (isOwner) return "Моя";
  const labels: Record<string, string> = {
    hh: "hh.ru",
    avito: "Avito",
    superjob: "SuperJob",
    platform: "JobAISearch",
  };
  return labels[source] || source;
}

function getSourceColor(source: string, isOwner: boolean): string {
  if (isOwner) return "bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/30 border";
  const colors: Record<string, string> = {
    hh: "bg-red-500/10 text-red-500 border-red-500/30 border",
    avito: "bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/30 border",
    superjob: "bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]/30 border",
    platform: "bg-[#ff6b00]/10 text-[#ff6b00] border-[#ff6b00]/50 border shadow-[0_0_10px_rgba(255,107,0,0.2)]",
  };
  return colors[source] || "bg-[#c5c6c7]/10 text-[#c5c6c7] border-[#c5c6c7]/30 border";
}

export default function VacancyListCard({ vacancy, currentUserId }: VacancyListCardProps) {
  const salary = formatSalary(vacancy.salary_from, vacancy.salary_to);
  const experience = formatExperience(vacancy.experience);
  const isPlatform = vacancy.source === "platform";
  const isOwner = isPlatform && !!currentUserId && vacancy.user_id === currentUserId;

  // For platform vacancies, link to internal page
  const vacancyLink = isPlatform ? `/vacancies/${vacancy.id}` : vacancy.url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1f2833]/40 backdrop-blur-md rounded-2xl border border-[#c5c6c7]/10 p-5 hover:border-[#00f0ff]/40 hover:shadow-[0_0_20px_rgba(0,240,255,0.15)] transition-all duration-300 group/card relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#00f0ff]/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 rounded-bl-full pointer-events-none" />

      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-4 relative z-10">
        <div className="flex-1">
          {/* Title */}
          {isPlatform ? (
            <Link
              href={vacancyLink}
              className="text-lg font-bold text-white group-hover/card:text-[#00f0ff] transition-colors drop-shadow-sm"
            >
              {vacancy.title}
            </Link>
          ) : (
            <a
              href={vacancyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-bold text-white group-hover/card:text-[#00f0ff] transition-colors drop-shadow-sm"
            >
              {vacancy.title}
            </a>
          )}

          {/* Tags */}
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            {experience && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-[#0b0c10]/50 text-[#c5c6c7]/80 rounded border border-[#c5c6c7]/10">
                {experience}
              </span>
            )}
            {vacancy.employment_type === "remote" && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-[#00f0ff]/10 text-[#00f0ff] rounded border border-[#00f0ff]/30">
                Удалённо
              </span>
            )}
          </div>
        </div>

        {/* Source badge */}
        <span className={`text-[10px] uppercase font-black tracking-widest px-2.5 py-1.5 rounded shrink-0 ${getSourceColor(vacancy.source, isOwner)}`}>
          {getSourceLabel(vacancy.source, isOwner)}
        </span>
      </div>

      {/* Salary */}
      {salary && (
        <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#00c0cc] drop-shadow-[0_0_8px_rgba(0,240,255,0.4)] mb-3 relative z-10">
          {salary}
        </p>
      )}

      {/* Company & City */}
      <div className="flex items-center gap-3 text-sm text-[#c5c6c7]/80 font-medium mb-4 relative z-10">
        <span className="text-white truncate max-w-[200px] sm:max-w-xs">{vacancy.company}</span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#ff6b00]" />
        <span className="text-[#c5c6c7]/60">{vacancy.city}</span>
      </div>

      {/* Description */}
      {vacancy.description && (
        <p className="text-sm text-[#c5c6c7]/50 line-clamp-2 leading-relaxed mb-5 relative z-10">
          {vacancy.description}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 relative z-10 pt-4 border-t border-[#c5c6c7]/5">
        {isOwner ? (
          // Owner actions
          <>
            <Link
              href={vacancyLink}
              className="px-5 py-2.5 bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] text-[#0b0c10] text-[11px] uppercase tracking-widest font-black rounded-lg hover:shadow-[0_0_15px_rgba(255,107,0,0.4)] transition-all hover:scale-[1.02]"
            >
              Подробнее
            </Link>
            <Link
              href="/vacancies/my"
              className="px-5 py-2.5 border border-[#c5c6c7]/20 text-[#c5c6c7] text-[11px] uppercase tracking-widest font-bold rounded-lg hover:bg-[#c5c6c7]/10 hover:text-white transition-colors"
            >
              Управление
            </Link>
          </>
        ) : isPlatform ? (
          // Platform vacancy (not owner)
          <>
            <Link
              href={vacancyLink}
              className="px-5 py-2.5 bg-gradient-to-r from-[#00f0ff] to-[#00c0cc] text-[#0b0c10] text-[11px] uppercase tracking-widest font-black rounded-lg hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all hover:scale-[1.02]"
            >
              Подробнее
            </Link>
            <Link
              href={`/messages?vacancy=${vacancy.id}`}
              className="px-5 py-2.5 border border-[#00f0ff]/30 text-[#00f0ff] text-[11px] uppercase tracking-widest font-bold rounded-lg hover:bg-[#00f0ff]/10 hover:shadow-[0_0_10px_rgba(0,240,255,0.2)] transition-all"
            >
              Написать
            </Link>
          </>
        ) : (
          // External vacancy
          <>
            <a
              href={vacancyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="group/btn flex items-center gap-2 px-5 py-2.5 bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff]/20 hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:text-white text-[11px] uppercase tracking-widest font-black rounded-lg transition-all"
            >
              Откликнуться
              <svg className="w-3.5 h-3.5 text-[#00f0ff] group-hover/btn:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </>
        )}
      </div>
    </motion.div>
  );
}

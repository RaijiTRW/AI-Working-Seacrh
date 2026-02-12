"use client";

import Link from "next/link";

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
    return `${from.toLocaleString("ru-RU")} - ${to.toLocaleString("ru-RU")} ₽`;
  }
  if (from) {
    return `от ${from.toLocaleString("ru-RU")} ₽`;
  }
  if (to) {
    return `до ${to.toLocaleString("ru-RU")} ₽`;
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
    platform: "Наша",
  };
  return labels[source] || source;
}

function getSourceColor(source: string, isOwner: boolean): string {
  if (isOwner) return "bg-green-100 text-green-600 ring-2 ring-green-300";
  const colors: Record<string, string> = {
    hh: "bg-red-100 text-red-600",
    avito: "bg-green-100 text-green-600",
    superjob: "bg-blue-100 text-blue-600",
    platform: "bg-orange-100 text-orange-600 ring-2 ring-orange-300",
  };
  return colors[source] || "bg-gray-100 text-gray-600";
}

export default function VacancyListCard({ vacancy, currentUserId }: VacancyListCardProps) {
  const salary = formatSalary(vacancy.salary_from, vacancy.salary_to);
  const experience = formatExperience(vacancy.experience);
  const isPlatform = vacancy.source === "platform";
  const isOwner = isPlatform && !!currentUserId && vacancy.user_id === currentUserId;

  // For platform vacancies, link to internal page
  const vacancyLink = isPlatform ? `/vacancies/${vacancy.id}` : vacancy.url;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg hover:border-orange-200 transition-all duration-200 group/card">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          {/* Title */}
          {isPlatform ? (
            <Link
              href={vacancyLink}
              className="text-lg font-semibold text-gray-900 group-hover/card:text-orange-600 transition-colors"
            >
              {vacancy.title}
            </Link>
          ) : (
            <a
              href={vacancyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-semibold text-gray-900 group-hover/card:text-orange-600 transition-colors"
            >
              {vacancy.title}
            </a>
          )}

          {/* Tags */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {experience && (
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                {experience}
              </span>
            )}
            {vacancy.employment_type === "remote" && (
              <span className="text-xs px-2 py-1 bg-purple-100 text-purple-600 rounded-full">
                Можно удаленно
              </span>
            )}
          </div>
        </div>

        {/* Source badge */}
        <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${getSourceColor(vacancy.source, isOwner)}`}>
          {getSourceLabel(vacancy.source, isOwner)}
        </span>
      </div>

      {/* Salary */}
      {salary && (
        <p className="text-xl font-bold text-gray-900 mb-3">{salary}</p>
      )}

      {/* Company */}
      <p className="text-sm text-gray-700 font-medium mb-1">{vacancy.company}</p>

      {/* City */}
      <p className="text-sm text-gray-500 mb-3">{vacancy.city}</p>

      {/* Description */}
      {vacancy.description && (
        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
          {vacancy.description}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        {isOwner ? (
          // Owner actions
          <>
            <Link
              href={vacancyLink}
              className="px-5 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-xl hover:bg-orange-600 transition-colors"
            >
              Подробнее
            </Link>
            <Link
              href="/vacancies/my"
              className="px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              Управление
            </Link>
          </>
        ) : isPlatform ? (
          // Platform vacancy (not owner)
          <>
            <Link
              href={vacancyLink}
              className="px-5 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-xl hover:bg-orange-600 transition-colors"
            >
              Подробнее
            </Link>
            <Link
              href={`/messages?vacancy=${vacancy.id}`}
              className="px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
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
              className="px-5 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-xl hover:bg-orange-600 transition-colors"
            >
              Откликнуться
            </a>
          </>
        )}
      </div>
    </div>
  );
}

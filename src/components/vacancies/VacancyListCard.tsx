"use client";

import Link from "next/link";

export interface Vacancy {
  id: string;
  title: string;
  company: string;
  salary_from?: number;
  salary_to?: number;
  salary_currency?: string;
  // Новые поля структурированного оффера (для platform вакансий)
  salary_type?: "fix" | "range" | "bonuses" | "kpi";
  salary_tax_type?: "gross" | "net";
  salary_period?: "month" | "week" | "day" | "hour" | "shift" | "project";
  salary_bonuses?: { enabled: boolean; description?: string };
  salary_kpi?: { enabled: boolean; description?: string; max_percentage?: number };
  contract_type?: "labor_rf" | "gph" | "ip" | "self_employed";
  work_format?: "office" | "remote" | "hybrid";
  grade_level?: "intern" | "junior" | "middle" | "senior" | "lead" | "principal";
  // Старые поля
  city: string;
  experience?: string;
  employment_type?: string;
  description: string;
  url: string;
  source: string;
  user_id?: string;
}

interface VacancyListCardProps {
  vacancy: Vacancy;
  currentUserId?: string;
}

function formatSalary(vacancy: Vacancy): string {
  const { salary_from, salary_to, salary_type, salary_tax_type, salary_period } = vacancy;

  // Для новых вакансий с структурированным оффером
  if (salary_period && salary_tax_type) {
    const periodLabel: Record<string, string> = {
      month: "мес",
      week: "нед",
      day: "день",
      hour: "час",
      shift: "смена",
      project: "проект",
    };
    const taxLabel = salary_tax_type === "gross" ? "до вычета НДФЛ" : "на руки";
    const period = periodLabel[salary_period] || "мес";

    if (salary_type === "fix" && salary_from) {
      return `${salary_from.toLocaleString("ru-RU")} ₽/${period} (${taxLabel})`;
    }
    if (salary_type === "range" && salary_from && salary_to) {
      return `${salary_from.toLocaleString("ru-RU")} - ${salary_to.toLocaleString("ru-RU")} ₽/${period} (${taxLabel})`;
    }
    if (salary_type === "bonuses") {
      return `По результатам (${taxLabel})`;
    }
    if (salary_type === "kpi") {
      return `KPI (${taxLabel})`;
    }
  }

  // Fallback для старых вакансий
  if (salary_from && salary_to) {
    return `${salary_from.toLocaleString("ru-RU")} - ${salary_to.toLocaleString("ru-RU")} ₽`;
  }
  if (salary_from) {
    return `от ${salary_from.toLocaleString("ru-RU")} ₽`;
  }
  if (salary_to) {
    return `до ${salary_to.toLocaleString("ru-RU")} ₽`;
  }
  return "";
}

function getContractTypeLabel(type?: string): string {
  if (!type) return "";
  const labels: Record<string, string> = {
    labor_rf: "ТК РФ",
    gph: "ГПХ",
    ip: "ИП",
    self_employed: "Самозанятый",
  };
  return labels[type] || type;
}

function getWorkFormatLabel(format?: string): string {
  if (!format) return "";
  const labels: Record<string, string> = {
    office: "Офис",
    remote: "Удалённо",
    hybrid: "Гибрид",
  };
  return labels[format] || format;
}

function getGradeLevelLabel(level?: string): string {
  if (!level) return "";
  const labels: Record<string, string> = {
    intern: "Стажёр",
    junior: "Junior / Младший",
    middle: "Middle / Средний",
    senior: "Senior / Старший",
    lead: "Lead / Ведущий",
    principal: "Principal / Главный",
  };
  return labels[level] || level;
}

function getExperienceLabel(experience?: string): string {
  if (!experience) return "";
  const labels: Record<string, string> = {
    "no_experience": "Опыт: Не требуется",
    "1-3": "Опыт: 1-3 года",
    "3-6": "Опыт: 3-6 лет",
    "6+": "Опыт: Более 6 лет",
  };
  return labels[experience] || experience;
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
  const salary = formatSalary(vacancy);
  const isPlatform = vacancy.source === "platform";
  const isOwner = isPlatform && !!currentUserId && vacancy.user_id === currentUserId;

  // For platform vacancies, link to internal page
  const vacancyLink = isPlatform ? `/vacancies/${vacancy.id}` : vacancy.url;

  // Новые поля для platform вакансий
  const contractLabel = isPlatform ? getContractTypeLabel(vacancy.contract_type) : "";
  const workFormatLabel = isPlatform ? getWorkFormatLabel(vacancy.work_format) : "";
  const gradeLabel = isPlatform ? getGradeLevelLabel(vacancy.grade_level) : "";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg hover:border-orange-200 transition-all duration-200 group">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          {/* Title */}
          {isPlatform ? (
            <Link
              href={vacancyLink}
              className="text-lg font-semibold text-gray-900 group-hover:text-orange-600 transition-colors"
            >
              {vacancy.title}
            </Link>
          ) : (
            <a
              href={vacancyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-semibold text-gray-900 group-hover:text-orange-600 transition-colors"
            >
              {vacancy.title}
            </a>
          )}

          {/* Tags */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Уровень позиции (для platform вакансий) */}
            {gradeLabel && (
              <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-600 rounded-full font-medium">
                {gradeLabel}
              </span>
            )}
            {/* Формат работы (для platform вакансий) */}
            {workFormatLabel && (
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
                {workFormatLabel}
              </span>
            )}
            {/* Старые теги */}
            {vacancy.experience && (
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                {getExperienceLabel(vacancy.experience)}
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

      {/* Contract type badge (для platform вакансий) */}
      {contractLabel && (
        <div className="mb-3">
          <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
            {contractLabel}
          </span>
        </div>
      )}

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
            <button className="px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
              Контакты
            </button>
          </>
        )}
      </div>
    </div>
  );
}

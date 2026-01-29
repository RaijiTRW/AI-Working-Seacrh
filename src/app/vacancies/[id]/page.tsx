"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/landing/Header";
import { getVacancyById, EmployerVacancy, incrementVacancyViews } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

function formatSalary(vacancy: EmployerVacancy): string {
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
  return "Не указана";
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
    office: "В офисе",
    remote: "Удалённо",
    hybrid: "Гибрид",
  };
  return labels[format] || format;
}

function getOvertimePolicyLabel(policy?: string): string {
  if (!policy) return "";
  const labels: Record<string, string> = {
    paid: "Оплачиваются",
    unpaid: "Не оплачиваются",
    negotiable: "По договорённости",
  };
  return labels[policy] || policy;
}

function getGradeLevelLabel(level?: string): string {
  if (!level) return "";
  const labels: Record<string, string> = {
    intern: "Intern / Стажёр",
    junior: "Junior / Младший",
    middle: "Middle / Средний",
    senior: "Senior / Старший",
    lead: "Lead / Ведущий",
    principal: "Principal / Главный",
  };
  return labels[level] || level;
}

function getScheduleLabel(schedule?: string): string {
  if (!schedule) return "";
  const labels: Record<string, string> = {
    fullDay: "Полный день",
    shift: "Сменный (2/2, 3/3 и т.д.)",
    flexible: "Гибкий график",
    remote: "Удаленная работа",
  };
  return labels[schedule] || schedule;
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

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function VacancyDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const [vacancy, setVacancy] = useState<EmployerVacancy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const viewCounted = useRef(false);

  useEffect(() => {
    async function fetchVacancy() {
      try {
        let id = params.id as string;
        // Strip "platform_" prefix if present
        if (id.startsWith("platform_")) {
          id = id.replace("platform_", "");
        }
        const data = await getVacancyById(id);
        setVacancy(data);
      } catch (err) {
        setError("Вакансия не найдена");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchVacancy();
    }
  }, [params.id]);

  useEffect(() => {
    viewCounted.current = false;
  }, [params.id]);

  useEffect(() => {
    if (!vacancy?.id) return;
    if (viewCounted.current) return;
    viewCounted.current = true;
    void incrementVacancyViews(vacancy.id);
  }, [vacancy?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-24 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (error || !vacancy) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-24 max-w-4xl mx-auto px-6 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Вакансия не найдена</h1>
          <p className="text-gray-600 mb-6">{error || "Возможно, она была удалена или скрыта"}</p>
          <Link
            href="/vacancies"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
          >
            Вернуться к вакансиям
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link href="/vacancies" className="hover:text-orange-500">
              Вакансии
            </Link>
            <span>/</span>
            <span className="text-gray-900">{vacancy.title}</span>
          </nav>

          {/* Main card */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full mb-3 ${user && user.id === vacancy.user_id
                      ? "bg-green-100 text-green-600"
                      : "bg-orange-100 text-orange-600"
                    }`}>
                    {user && user.id === vacancy.user_id ? "Моя вакансия" : "Наша вакансия"}
                  </span>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {vacancy.title}
                  </h1>
                  <p className="text-lg text-gray-700 font-medium">{vacancy.company}</p>
                </div>
              </div>

              {/* Salary - структурированная */}
              <div className="mb-4">
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {formatSalary(vacancy)}
                </div>

                {/* Бонусы */}
                {vacancy.salary_bonuses?.enabled && vacancy.salary_bonuses.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    💰 Бонусы: {vacancy.salary_bonuses.description}
                  </p>
                )}

                {/* KPI */}
                {vacancy.salary_kpi?.enabled && vacancy.salary_kpi.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    📊 KPI: {vacancy.salary_kpi.description}
                    {vacancy.salary_kpi.max_percentage && ` (до ${vacancy.salary_kpi.max_percentage}% от оклада)`}
                  </p>
                )}
              </div>

              {/* Tags - с новыми полями */}
              <div className="flex flex-wrap gap-2">
                {/* Уровень позиции */}
                {vacancy.grade_level && (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm rounded-full font-medium">
                    {getGradeLevelLabel(vacancy.grade_level)}
                  </span>
                )}

                {/* Формат работы */}
                {vacancy.work_format && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                    {getWorkFormatLabel(vacancy.work_format)}
                  </span>
                )}

                {/* Тип договора */}
                {vacancy.contract_type && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm rounded-full">
                    {getContractTypeLabel(vacancy.contract_type)}
                  </span>
                )}

                {/* Город */}
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                  {vacancy.city}
                </span>

                {/* Опыт (старое поле) */}
                {vacancy.experience && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                    {getExperienceLabel(vacancy.experience)}
                  </span>
                )}

                {/* Тип занятости (старое поле) */}
                {vacancy.employment_type && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                    {vacancy.employment_type === "full" ? "Полная занятость" :
                      vacancy.employment_type === "part" ? "Частичная занятость" :
                        vacancy.employment_type === "remote" ? "Удалённая работа" :
                          vacancy.employment_type}
                  </span>
                )}

                {/* График (старое поле) */}
                {vacancy.schedule && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                    {getScheduleLabel(vacancy.schedule)}
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Новая секция: Условия работы (структурированные) */}
              {(vacancy.work_hours || vacancy.overtime_policy || Number(vacancy.probation_months) > 0) && (
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Условия работы</h2>

                  {/* Часы работы */}
                  {vacancy.work_hours && (
                    <div className="mb-2">
                      <span className="text-sm text-gray-500">Часы работы: </span>
                      <span className="text-gray-700">
                        {vacancy.work_hours.type === "per_day" && `${vacancy.work_hours.hours} ч/день`}
                        {vacancy.work_hours.type === "per_week" && `${vacancy.work_hours.hours} ч/неделю`}
                        {vacancy.work_hours.type === "range" && `с ${vacancy.work_hours.from} до ${vacancy.work_hours.to}`}
                      </span>
                    </div>
                  )}

                  {/* Переработки */}
                  {vacancy.overtime_policy && (
                    <div className="mb-2">
                      <span className="text-sm text-gray-500">Переработки: </span>
                      <span className="text-gray-700">{getOvertimePolicyLabel(vacancy.overtime_policy)}</span>
                    </div>
                  )}

                  {/* Испытательный срок */}
                  {Number(vacancy.probation_months) > 0 && (
                    <div>
                      <span className="text-sm text-gray-500">Испытательный срок: </span>
                      <span className="text-gray-700">
                        {Number(vacancy.probation_months)} мес
                        {Number(vacancy.probation_salary_reduction) > 0 &&
                          `, снижение ЗП на ${vacancy.probation_salary_reduction}%`}
                        {(!vacancy.probation_salary_reduction || Number(vacancy.probation_salary_reduction) === 0) &&
                          `, без снижения ЗП`}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Технический стек */}
              {vacancy.tech_stack && vacancy.tech_stack.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Технический стек</h2>
                  <div className="flex flex-wrap gap-2">
                    {vacancy.tech_stack.map((tech, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Обязанности (структурированные) */}
              {vacancy.responsibilities && vacancy.responsibilities.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Обязанности</h2>
                  <ul className="list-disc pl-5 space-y-1">
                    {vacancy.responsibilities.map((resp, index) => (
                      <li key={index} className="text-gray-700">{resp.text}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Description (старое поле) */}
              {vacancy.description && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Описание</h2>
                  <div className="text-gray-700 whitespace-pre-wrap">{vacancy.description}</div>
                </div>
              )}

              {/* Requirements (старое поле) */}
              {vacancy.requirements && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Требования</h2>
                  <div className="text-gray-700 whitespace-pre-wrap">{vacancy.requirements}</div>
                </div>
              )}

              {/* Conditions (старое поле) */}
              {vacancy.conditions && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Условия</h2>
                  <div className="text-gray-700 whitespace-pre-wrap">{vacancy.conditions}</div>
                </div>
              )}
            </div>

            {/* Contact section */}
            <div id="contact" className="p-6 bg-gray-50 border-t border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Контакты</h2>

              <div className="space-y-3 mb-6">
                {vacancy.contact_name && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-gray-700">{vacancy.contact_name}</span>
                  </div>
                )}
                {vacancy.contact_email && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <a href={`mailto:${vacancy.contact_email}`} className="text-orange-500 hover:underline">
                      {vacancy.contact_email}
                    </a>
                  </div>
                )}
                {vacancy.contact_phone && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <a href={`tel:${vacancy.contact_phone}`} className="text-orange-500 hover:underline">
                      {vacancy.contact_phone}
                    </a>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                {user && user.id === vacancy.user_id ? (
                  <Link
                    href={`/vacancies/edit/${vacancy.id}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Редактировать
                  </Link>
                ) : user ? (
                  <Link
                    href={`/messages?vacancy=${vacancy.id}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Написать работодателю
                  </Link>
                ) : (
                  <Link
                    href="/auth"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors"
                  >
                    Войти чтобы откликнуться
                  </Link>
                )}

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Ссылка скопирована!");
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Поделиться
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 text-sm text-gray-500">
              {vacancy.published_at && (
                <span>Опубликовано {formatDate(vacancy.published_at)}</span>
              )}
              {vacancy.views_count !== undefined && (
                <span className="ml-4">Просмотров: {vacancy.views_count}</span>
              )}
            </div>
          </div>

          {/* Back button */}
          <div className="mt-6">
            <Link
              href="/vacancies"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Назад к вакансиям
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/app/Header";
import { incrementVacancyViews, EmployerVacancy, NetworkVacancy } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";
import { motion } from "framer-motion";

interface VacancyDetailClientProps {
  vacancyId: string;
  initialVacancy: EmployerVacancy | NetworkVacancy;
  isNetwork: boolean;
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

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatExperience(experience?: string): string | null {
  if (!experience) return null;

  const experienceMap: Record<string, string> = {
    no_experience: "Без опыта",
    noexperience: "Без опыта",
    "1-3": "1-3 года",
    "3-6": "3-6 лет",
    "6+": "Более 6 лет",
    between1and3: "1-3 года",
    between3and6: "3-6 лет",
    morethan6: "Более 6 лет",
  };

  if (experienceMap[experience]) {
    return experienceMap[experience];
  }

  const russianPatterns = ["без опыта", "не требуется", "нет опыта", "от 1 до 3", "от 3 до 6", "более 6", "1-3 года", "3-6 лет"];
  const lowerExp = experience.toLowerCase();
  if (russianPatterns.some((pattern) => lowerExp.includes(pattern))) {
    return experience;
  }

  return null;
}

function formatEmploymentType(employment?: string): string | null {
  if (!employment) return null;

  const employmentMap: Record<string, string> = {
    full: "Полная занятость",
    part: "Частичная занятость",
    project: "Проектная работа",
    internship: "Стажировка",
    remote: "Удалённая работа",
  };

  return employmentMap[employment] || employment;
}

function formatSchedule(schedule?: string): string | null {
  if (!schedule) return null;

  const scheduleMap: Record<string, string> = {
    fullDay: "Полный день",
    shift: "Сменный график",
    flexible: "Гибкий график",
    remote: "Удалённая работа",
  };

  return scheduleMap[schedule] || schedule;
}

export default function VacancyDetailClient({ vacancyId, initialVacancy, isNetwork }: VacancyDetailClientProps) {
  const { user } = useAuth();
  const [vacancy] = useState<EmployerVacancy | NetworkVacancy>(initialVacancy);

  useEffect(() => {
    // Increment view count only for platform vacancies (не считаем просмотры владельца)
    if (!isNetwork && vacancy && ("user_id" in vacancy) && (!user || vacancy.user_id !== user.id)) {
      incrementVacancyViews(vacancyId);
    }
  }, [vacancyId, vacancy, user, isNetwork]);

  // Helper to get source label
  const getSourceLabel = (source: string): string => {
    const labels: Record<string, string> = {
      hh: "hh.ru",
      avito: "Avito",
      superjob: "SuperJob",
    };
    return labels[source] || source;
  };

  // Check if vacancy has network source
  const hasSource = isNetwork && "source" in vacancy;

  if (error) {
    return (
      <div className="min-h-screen bg-[#0b0c10] relative">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 pointer-events-none" />
        <Header />
        <div className="pt-32 max-w-4xl mx-auto px-6 py-12 text-center relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 mb-6 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-white mb-4 tracking-wide">Вакансия не найдена</h1>
          <p className="text-[#c5c6c7]/70 mb-8 max-w-lg mx-auto">{error || "Возможно, она была удалена или скрыта настройками приватности."}</p>
          <Link
            href="/vacancies"
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] text-[#0b0c10] font-black uppercase tracking-widest rounded-xl hover:shadow-[0_0_20px_rgba(255,107,0,0.4)] transition-all hover:scale-[1.02]"
          >
            К списку вакансий
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#0b0c10] relative">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 pointer-events-none" />
      <Header />

      <main className="pt-24 sm:pt-32 pb-16 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs uppercase font-bold tracking-wider text-[#c5c6c7]/50 mb-6 sm:mb-8">
            <Link href="/vacancies" className="hover:text-[#ff6b00] transition-colors">
              Вакансии
            </Link>
            <span>/</span>
            <span className="text-white truncate">{vacancy.title}</span>
          </nav>

          {/* Main card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1f2833]/60 backdrop-blur-xl rounded-3xl border border-[#c5c6c7]/10 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#00f0ff]/10 to-transparent rounded-bl-full pointer-events-none" />

            {/* Header */}
            <div className="p-6 sm:p-8 border-b border-[#c5c6c7]/10 relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <div>
                  {hasSource ? (
                    <span className="inline-flex px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg mb-4 bg-blue-500/10 text-blue-400 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                      {getSourceLabel(vacancy.source)}
                    </span>
                  ) : (
                    <span
                      className={`inline-flex px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg mb-4 border ${user && "user_id" in vacancy && user.id === vacancy.user_id
                        ? "bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/30 shadow-[0_0_10px_rgba(0,255,136,0.2)]"
                        : "bg-[#ff6b00]/10 text-[#ff6b00] border-[#ff6b00]/40 shadow-[0_0_10px_rgba(255,107,0,0.2)]"
                        }`}
                    >
                      {user && "user_id" in vacancy && user.id === vacancy.user_id ? "Моя публикация" : "JobAISearch"}
                    </span>
                  )}
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2 leading-tight drop-shadow-sm">{vacancy.title}</h1>
                  <p className="text-lg text-[#00f0ff] font-bold drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]">{vacancy.company}</p>
                </div>
              </div>

              {/* Salary */}
              <div className="text-xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] drop-shadow-[0_0_10px_rgba(255,107,0,0.4)] mb-6">
                {formatSalary(vacancy.salary_from, vacancy.salary_to)}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2.5">
                <span className="px-3 py-1.5 bg-[#0b0c10]/80 border border-[#c5c6c7]/20 text-[#c5c6c7] text-xs font-bold uppercase tracking-wider rounded-lg shadow-inner">{vacancy.city}</span>
                {(() => {
                  const exp = formatExperience(vacancy.experience);
                  return exp && <span className="px-3 py-1.5 bg-[#0b0c10]/80 border border-[#c5c6c7]/20 text-[#c5c6c7] text-xs font-bold uppercase tracking-wider rounded-lg shadow-inner">{exp}</span>;
                })()}
                {(() => {
                  const emp = formatEmploymentType(vacancy.employment_type);
                  return emp && <span className="px-3 py-1.5 bg-[#0b0c10]/80 border border-[#c5c6c7]/20 text-[#c5c6c7] text-xs font-bold uppercase tracking-wider rounded-lg shadow-inner">{emp}</span>;
                })()}
                {(() => {
                  const sch = formatSchedule(vacancy.schedule);
                  return sch && <span className="px-3 py-1.5 bg-[#0b0c10]/80 border border-[#c5c6c7]/20 text-[#c5c6c7] text-xs font-bold uppercase tracking-wider rounded-lg shadow-inner">{sch}</span>;
                })()}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8 space-y-8 relative z-10 text-[#c5c6c7]/90 leading-relaxed font-medium">
              {/* Description */}
              {vacancy.description && (
                <div>
                  <h2 className="text-lg font-black uppercase tracking-widest text-[#00f0ff] mb-4 flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] shadow-[0_0_8px_rgba(0,240,255,0.8)] animate-pulse" />
                    Описание
                  </h2>
                  <div className="whitespace-pre-wrap">{vacancy.description}</div>
                </div>
              )}

              {/* Requirements */}
              {vacancy.requirements && (
                <div>
                  <h2 className="text-lg font-black uppercase tracking-widest text-[#00f0ff] mb-4 flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] shadow-[0_0_8px_rgba(0,240,255,0.8)] animate-pulse" />
                    Требования
                  </h2>
                  <div className="whitespace-pre-wrap">{vacancy.requirements}</div>
                </div>
              )}

              {/* Conditions */}
              {vacancy.conditions && (
                <div>
                  <h2 className="text-lg font-black uppercase tracking-widest text-[#00f0ff] mb-4 flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] shadow-[0_0_8px_rgba(0,240,255,0.8)] animate-pulse" />
                    Условия
                  </h2>
                  <div className="whitespace-pre-wrap">{vacancy.conditions}</div>
                </div>
              )}
            </div>

            {/* Contact section */}
            <div id="contact" className="p-6 sm:p-8 bg-[#0b0c10]/50 border-t border-[#c5c6c7]/10 relative z-10 backdrop-blur-md">
              {hasSource ? (
                // Network vacancy - show external apply button
                <div>
                  <h2 className="text-lg font-black uppercase tracking-widest text-[#ff6b00] mb-4">Откликнуться</h2>
                  <p className="text-[#c5c6c7]/80 text-sm mb-6 max-w-2xl leading-relaxed">
                    Эта вакансия первоначально опубликована на платформе <span className="text-white font-black drop-shadow-sm">{getSourceLabel(vacancy.source)}</span>. Нажмите кнопку ниже для безопасного перехода на оригинальную страницу.
                  </p>

                  <div className="flex flex-wrap gap-4">
                    <a
                      href={vacancy.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#00f0ff] to-[#00c0cc] text-[#0b0c10] font-black uppercase tracking-widest text-sm rounded-xl hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all hover:scale-[1.02]"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Перейти на {getSourceLabel(vacancy.source)}
                    </a>

                    <button
                      onClick={async () => {
                        const shareData = {
                          title: vacancy.title,
                          text: `${vacancy.title}\n${vacancy.company}\n${formatSalary(vacancy.salary_from, vacancy.salary_to)}\n${vacancy.city}`,
                          url: window.location.href,
                        };

                        try {
                          if (navigator.share && navigator.canShare(shareData)) {
                            await navigator.share(shareData);
                          } else {
                            await navigator.clipboard.writeText(window.location.href);
                            alert("Ссылка скопирована!");
                          }
                        } catch (err) {
                          if ((err as Error).name !== "AbortError") {
                          }
                        }
                      }}
                      className="inline-flex items-center gap-2 px-6 py-3 border border-[#c5c6c7]/20 text-[#c5c6c7] font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-[#c5c6c7]/10 hover:text-white transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                        />
                      </svg>
                      Поделиться
                    </button>
                  </div>
                </div>
              ) : (
                // Platform vacancy - show contact info
                <>
                  <h2 className="text-lg font-black uppercase tracking-widest text-[#ff6b00] mb-4">Панель связи</h2>

                  <div className="space-y-4 mb-8">
                    {"contact_name" in vacancy && vacancy.contact_name && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1f2833]/80 border border-[#c5c6c7]/10 shadow-[0_4px_20px_rgba(0,0,0,0.3)] w-full max-w-sm">
                        <div className="w-10 h-10 rounded-full bg-[#ff6b00]/10 border border-[#ff6b00]/20 flex items-center justify-center flex-shrink-0 text-[#ff6b00]">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-[#c5c6c7]/50 tracking-wider">Имя контактного лица</p>
                          <span className="text-white font-bold">{vacancy.contact_name}</span>
                        </div>
                      </div>
                    )}
                    {"contact_email" in vacancy && vacancy.contact_email && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1f2833]/80 border border-[#c5c6c7]/10 shadow-[0_4px_20px_rgba(0,0,0,0.3)] w-full max-w-sm">
                        <div className="w-10 h-10 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/20 flex items-center justify-center flex-shrink-0 text-[#00f0ff]">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-[#c5c6c7]/50 tracking-wider">Email</p>
                          <a href={`mailto:${vacancy.contact_email}`} className="text-[#00f0ff] font-bold hover:underline">
                            {vacancy.contact_email}
                          </a>
                        </div>
                      </div>
                    )}
                    {"contact_phone" in vacancy && vacancy.contact_phone && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1f2833]/80 border border-[#c5c6c7]/10 shadow-[0_4px_20px_rgba(0,0,0,0.3)] w-full max-w-sm">
                        <div className="w-10 h-10 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center flex-shrink-0 text-[#00ff88]">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-[#c5c6c7]/50 tracking-wider">Телефон</p>
                          <a href={`tel:${vacancy.contact_phone}`} className="text-white font-bold hover:text-[#00ff88] transition-colors hover:underline">
                            {vacancy.contact_phone}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-4">
                    {user && "user_id" in vacancy && user.id === vacancy.user_id ? (
                      <Link
                        href={`/vacancies/edit/${vacancy.id}`}
                        className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#00f0ff] to-[#00c0cc] text-[#0b0c10] font-black uppercase tracking-widest text-sm rounded-xl hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all hover:scale-[1.02]"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        В режим редактирования
                      </Link>
                    ) : user ? (
                      <Link
                        href={`/messages?vacancy=${vacancy.id}`}
                        className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] text-[#0b0c10] font-black uppercase tracking-widest text-sm rounded-xl hover:shadow-[0_0_20px_rgba(255,107,0,0.4)] transition-all hover:scale-[1.02]"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Откликнуться в чат
                      </Link>
                    ) : (
                      <Link
                        href="/auth"
                        className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#c5c6c7]/10 text-[#c5c6c7] font-black uppercase tracking-widest text-sm rounded-xl hover:bg-[#c5c6c7]/20 hover:text-white transition-all border border-[#c5c6c7]/20"
                      >
                        Авторизоваться для отклика
                      </Link>
                    )}

                    <button
                      onClick={async () => {
                        const shareData = {
                          title: vacancy.title,
                          text: `${vacancy.title}\n${vacancy.company}\n${formatSalary(vacancy.salary_from, vacancy.salary_to)}\n${vacancy.city}`,
                          url: window.location.href,
                        };

                        try {
                          // Try native share first (works on mobile and some desktop browsers)
                          if (navigator.share && navigator.canShare(shareData)) {
                            await navigator.share(shareData);
                          } else {
                            // Fallback: copy to clipboard
                            await navigator.clipboard.writeText(window.location.href);
                            alert("Ссылка скопирована!");
                          }
                        } catch (err) {
                          // User cancelled or error
                          if ((err as Error).name !== "AbortError") {
                          }
                        }
                      }}
                      className="inline-flex items-center gap-2 px-6 py-3 border border-[#c5c6c7]/20 text-[#c5c6c7] font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-[#c5c6c7]/10 hover:text-white transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                        />
                      </svg>
                      Поделиться
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 sm:px-8 py-5 border-t border-[#c5c6c7]/10 text-xs font-bold uppercase tracking-wider text-[#c5c6c7]/40 bg-[#0b0c10]/40 flex flex-wrap gap-4 items-center">
              {hasSource ? (
                <span>Добавлено {formatDate(vacancy.created_at)}</span>
              ) : (
                <>
                  {"published_at" in vacancy && vacancy.published_at && <span>Размещено {formatDate(vacancy.published_at)}</span>}
                  {"views_count" in vacancy && vacancy.views_count !== undefined && <span className="flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> Просмотров: {vacancy.views_count}</span>}
                </>
              )}
            </div>
          </motion.div>

          {/* Back button */}
          <div className="mt-8 mb-10 flex justify-center">
            <Link
              href="/vacancies"
              className="inline-flex items-center gap-2 px-6 py-2 border border-[#c5c6c7]/20 rounded-full text-[#c5c6c7]/70 hover:text-white hover:border-[#c5c6c7]/50 hover:bg-[#1f2833]/50 transition-all font-bold tracking-widest uppercase text-[11px]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              В основную ленту
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

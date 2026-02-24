"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/app/Header";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  getMyVacancies,
  deleteVacancy,
  publishVacancy,
  withdrawVacancy,
  EmployerVacancy,
} from "@/lib/api";

type ConfirmModalType = "delete" | "withdraw" | null;

interface ConfirmModalState {
  isOpen: boolean;
  type: ConfirmModalType;
  vacancyId: string | null;
  vacancyTitle: string;
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

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("ru-RU");
}

function formatTimeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "только что";
  if (diffMins < 60) return `${diffMins} мин. назад`;
  if (diffHours < 24) return `${diffHours} ч. назад`;
  if (diffDays < 7) return `${diffDays} дн. назад`;
  return formatDate(dateStr);
}

function getStatusBadge(status: string) {
  const badges: Record<string, { label: string; className: string }> = {
    draft: { label: "Черновик", className: "bg-[#c5c6c7]/10 text-[#c5c6c7] border border-[#c5c6c7]/20 shadow-[0_0_10px_rgba(197,198,199,0.1)]" },
    pending_review: { label: "На модерации", className: "bg-[#ff6b00]/10 text-[#ff6b00] border border-[#ff6b00]/30 shadow-[0_0_10px_rgba(255,107,0,0.2)]" },
    published: { label: "Опубликована", className: "bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/30 shadow-[0_0_10px_rgba(0,255,136,0.2)]" },
    rejected: { label: "Отклонена", className: "bg-red-500/10 text-red-500 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]" },
    closed: { label: "Закрыта", className: "bg-[#c5c6c7]/10 text-[#c5c6c7] border border-[#c5c6c7]/20 shadow-[0_0_10px_rgba(197,198,199,0.1)]" },
  };
  return badges[status] || { label: status, className: "bg-[#c5c6c7]/10 text-[#c5c6c7] border border-[#c5c6c7]/20" };
}

export default function MyVacanciesPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [vacancies, setVacancies] = useState<EmployerVacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [vacancyBanned, setVacancyBanned] = useState(false);
  const [vacancyBanReason, setVacancyBanReason] = useState("");
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    type: null,
    vacancyId: null,
    vacancyTitle: "",
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth");
        return;
      }
      setToken(session.access_token);

      // Check vacancy ban status
      const { data: profile } = await supabase
        .from("profiles")
        .select("can_create_vacancies, vacancy_ban_reason")
        .eq("user_id", session.user.id)
        .single();

      if (profile?.can_create_vacancies === false) {
        setVacancyBanned(true);
        setVacancyBanReason(profile.vacancy_ban_reason || "Нарушение правил публикации");
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (token) {
      fetchVacancies();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page]);

  const fetchVacancies = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const result = await getMyVacancies(token, page);
      setVacancies(result.vacancies);
      setTotal(result.total);
      setHasNext(result.has_next);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    // Find vacancy title for the modal
    const vacancy = vacancies.find((v) => v.id === id);
    setConfirmModal({
      isOpen: true,
      type: "delete",
      vacancyId: id,
      vacancyTitle: vacancy?.title || "",
    });
  };

  const confirmDelete = async () => {
    if (!token || !confirmModal.vacancyId) return;

    try {
      await deleteVacancy(confirmModal.vacancyId, token);
      fetchVacancies();
    } catch {
      alert("Не удалось удалить вакансию");
    } finally {
      setConfirmModal({ isOpen: false, type: null, vacancyId: null, vacancyTitle: "" });
    }
  };

  const handlePublish = async (id: string) => {
    if (!token) return;
    try {
      await publishVacancy(id, token);
      fetchVacancies();
    } catch {
      alert("Не удалось опубликовать вакансию");
    }
  };

  const handleWithdraw = async (id: string) => {
    if (!token) return;
    const vacancy = vacancies.find((v) => v.id === id);
    setConfirmModal({
      isOpen: true,
      type: "withdraw",
      vacancyId: id,
      vacancyTitle: vacancy?.title || "",
    });
  };

  const confirmWithdraw = async () => {
    if (!token || !confirmModal.vacancyId) return;

    try {
      await withdrawVacancy(confirmModal.vacancyId, token);
      fetchVacancies();
    } catch (error) {
      alert("Не удалось отозвать вакансию");
    } finally {
      setConfirmModal({ isOpen: false, type: null, vacancyId: null, vacancyTitle: "" });
    }
  };

  if (loading && vacancies.length === 0) {
    return (
      <div className="min-h-[100dvh] bg-[#0b0c10] relative">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 pointer-events-none" />
        <Header />
        <div className="pt-32 flex flex-col items-center justify-center relative z-10 space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-[#ff6b00] border-t-transparent rounded-full shadow-[0_0_15px_rgba(255,107,0,0.5)]" />
          <p className="text-[#c5c6c7] font-bold tracking-widest uppercase text-xs animate-pulse">Загрузка вакансий...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#0b0c10] relative">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 pointer-events-none" />
      <Header />

      <main className="pt-24 sm:pt-32 pb-16 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Vacancy Ban Notice */}
          {vacancyBanned && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 bg-red-500/10 border border-red-500/30 rounded-3xl p-6 shadow-[0_0_30px_rgba(239,68,68,0.15)] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl" />
              <div className="flex items-start gap-4 relative z-10">
                <div className="w-12 h-12 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase text-red-500 tracking-widest mb-2 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]">
                    Создание вакансий заблокировано
                  </h3>
                  <p className="text-[#c5c6c7]/80 mb-4 max-w-2xl leading-relaxed">
                    Вам запрещено создавать новые вакансии. Все ваши активные вакансии были сняты с публикации.
                  </p>
                  <div className="bg-[#0b0c10]/50 border border-red-500/20 rounded-xl p-4 inline-block">
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1.5 opacity-80">Причина блока</p>
                    <p className="text-[#c5c6c7] font-medium">{vacancyBanReason}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-wide flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff6b00] shadow-[0_0_10px_rgba(255,107,0,0.8)]" />
                Мои Вакансии
              </h1>
              <p className="text-[#c5c6c7]/60 mt-2 font-medium tracking-wide">
                {total > 0 ? `Всего вакансий: ${total}` : "У вас пока нет активных вакансий"}
              </p>
            </div>
            {!vacancyBanned && (
              <Link
                href="/vacancies/create"
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] text-[#0b0c10] text-xs sm:text-sm font-black uppercase tracking-widest rounded-xl hover:shadow-[0_0_20px_rgba(255,107,0,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Новая вакансия
              </Link>
            )}
          </div>

          {/* Vacancies list */}
          {vacancies.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1f2833]/40 backdrop-blur-md rounded-3xl border border-[#c5c6c7]/10 p-12 lg:p-16 text-center shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col items-center"
            >
              <div className="w-24 h-24 mb-6 rounded-full bg-[#1f2833] flex items-center justify-center border border-[#c5c6c7]/10 shadow-inner relative">
                <div className="absolute inset-0 bg-[#ff6b00]/10 rounded-full blur-xl" />
                <svg className="w-12 h-12 text-[#c5c6c7]/50 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-white tracking-wide mb-3">Записей не обнаружено</h3>
              <p className="text-[#c5c6c7]/70 text-lg mb-8 max-w-md">Ваш терминал публикаций пуст. Создайте новую вакансию, чтобы начать поиск талантов.</p>
              {!vacancyBanned && (
                <Link
                  href="/vacancies/create"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#1f2833]/80 border border-[#c5c6c7]/20 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-[#ff6b00]/10 hover:border-[#ff6b00]/30 hover:text-[#ff6b00] transition-all hover:shadow-[0_0_15px_rgba(255,107,0,0.2)]"
                >
                  Начать создание
                </Link>
              )}
            </motion.div>
          ) : (
            <div className="space-y-6">
              {vacancies.map((vacancy, i) => {
                const statusBadge = getStatusBadge(vacancy.status);
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={vacancy.id}
                    className="group bg-[#1f2833]/60 backdrop-blur-md rounded-2xl border border-[#c5c6c7]/10 p-5 sm:p-6 hover:border-[#ff6b00]/30 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_10px_40px_rgba(255,107,0,0.1)] relative overflow-hidden flex flex-col h-full"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#ff6b00]/5 to-transparent rounded-bl-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4 relative z-10">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${statusBadge.className}`}>
                            {statusBadge.label}
                          </span>
                          {vacancy.status === "pending_review" && vacancy.moderation_checked_at && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#ff6b00]/70 flex items-center gap-1.5">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              На модерации {formatTimeAgo(vacancy.moderation_checked_at)}
                            </span>
                          )}
                          {vacancy.status === "published" && vacancy.published_at && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#c5c6c7]/50">
                              Опубл. {formatDate(vacancy.published_at)}
                            </span>
                          )}
                          {vacancy.status === "rejected" && vacancy.moderation_checked_at && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#c5c6c7]/50">
                              Отклонена {formatDate(vacancy.moderation_checked_at)}
                            </span>
                          )}
                        </div>
                        <Link
                          href={`/vacancies/${vacancy.id}`}
                          className="text-xl font-black text-white hover:text-[#ff6b00] hover:drop-shadow-[0_0_8px_rgba(255,107,0,0.5)] transition-all drop-shadow-sm inline-block"
                        >
                          {vacancy.title}
                        </Link>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#c5c6c7]/80 mb-5 font-medium relative z-10">
                      <span className="flex items-center gap-1.5"><svg className="w-4 h-4 text-[#ff6b00]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>{vacancy.company}</span>
                      <span className="flex items-center gap-1.5"><svg className="w-4 h-4 text-[#00f0ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>{vacancy.city}</span>
                      {formatSalary(vacancy.salary_from, vacancy.salary_to) && (
                        <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b00] to-[#ff8c00]">
                          {formatSalary(vacancy.salary_from, vacancy.salary_to)}
                        </span>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-5 text-sm font-bold text-[#c5c6c7]/60 mb-5 bg-[#0b0c10]/40 p-3 rounded-xl border border-[#c5c6c7]/5 relative z-10 w-fit">
                      <span className="flex items-center gap-2 tracking-wide">
                        <svg className="w-4 h-4 text-[#00f0ff]/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {vacancy.views_count} <span className="text-[10px] uppercase tracking-widest text-[#c5c6c7]/40">просм.</span>
                      </span>
                      <span className="w-px h-4 bg-[#c5c6c7]/10" />
                      <span className="flex items-center gap-2 tracking-wide text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                        <svg className="w-4 h-4 text-[#ff6b00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {vacancy.responses_count} <span className="text-[10px] uppercase tracking-widest text-[#c5c6c7]/40">откл.</span>
                      </span>
                    </div>

                    {/* Rejection reason */}
                    {vacancy.status === "rejected" && vacancy.rejection_reason && (
                      <div className="mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-xl relative z-10 w-full">
                        <p className="text-[10px] font-black tracking-widest text-red-400 uppercase mb-1.5 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                          Причина отклонения
                        </p>
                        <p className="text-sm font-medium text-red-200">{vacancy.rejection_reason}</p>
                      </div>
                    )}

                    {/* Info message for pending_review */}
                    {vacancy.status === "pending_review" && (
                      <div className="mb-5 p-4 bg-[#00f0ff]/10 border border-[#00f0ff]/20 rounded-xl relative z-10 w-full">
                        <p className="text-[13px] font-medium text-[#00f0ff] flex items-start gap-2">
                          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Вакансия ожидает проверки модератором. Обычно это занимает 1-2 рабочих дня.</span>
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-auto flex items-center gap-3 pt-4 border-t border-[#c5c6c7]/5 flex-wrap relative z-10">
                      <Link
                        href={`/vacancies/${vacancy.id}`}
                        className="px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-[#c5c6c7] border border-[#c5c6c7]/20 rounded-xl hover:bg-[#c5c6c7]/10 hover:text-white transition-all flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        Просмотр
                      </Link>

                      {vacancy.status === "draft" || vacancy.status === "rejected" ? (
                        <>
                          <Link
                            href={`/vacancies/edit/${vacancy.id}`}
                            className="px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-[#c5c6c7] border border-[#c5c6c7]/20 rounded-xl hover:bg-[#c5c6c7]/10 hover:text-white transition-all flex items-center gap-1.5"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            Правка
                          </Link>
                          {!vacancyBanned && (
                            <button
                              onClick={() => handlePublish(vacancy.id)}
                              className="px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-[#00ff88] border border-[#00ff88]/30 bg-[#00ff88]/5 rounded-xl hover:bg-[#00ff88]/20 hover:shadow-[0_0_15px_rgba(0,255,136,0.2)] transition-all flex items-center gap-1.5"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              {vacancy.status === "rejected" ? "Повторить модерацию" : "Опубликовать"}
                            </button>
                          )}
                        </>
                      ) : vacancy.status === "pending_review" ? (
                        <>
                          <button
                            onClick={() => handleWithdraw(vacancy.id)}
                            className="px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-[#ff6b00] border border-[#ff6b00]/30 bg-[#ff6b00]/5 rounded-xl hover:bg-[#ff6b00]/15 hover:shadow-[0_0_15px_rgba(255,107,0,0.2)] transition-all"
                          >
                            Отозвать
                          </button>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#c5c6c7]/40 ml-auto hidden sm:block">
                            Запрещено редактирование
                          </span>
                        </>
                      ) : vacancy.status === "published" ? (
                        <Link
                          href={`/vacancies/edit/${vacancy.id}`}
                          className="px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-[#c5c6c7] border border-[#c5c6c7]/20 rounded-xl hover:bg-[#c5c6c7]/10 hover:text-white transition-all flex items-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          Правка
                        </Link>
                      ) : null}
                      <button
                        onClick={() => handleDelete(vacancy.id)}
                        className={`px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-all flex items-center gap-1.5 ${vacancy.status === "pending_review" ? "w-full sm:w-auto sm:ml-auto" : "ml-auto"}`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Снять
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {total > 20 && (
            <div className="flex justify-center items-center gap-4 mt-12 bg-[#1f2833]/40 p-2 rounded-2xl border border-[#c5c6c7]/10 w-fit mx-auto backdrop-blur-md">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-5 py-2.5 bg-[#0b0c10]/80 border border-[#c5c6c7]/20 rounded-xl text-xs font-black uppercase tracking-widest text-[#c5c6c7] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#c5c6c7]/10 hover:text-white transition-all shadow-inner"
              >
                Назад
              </button>
              <div className="flex items-center gap-2 px-2">
                <span className="text-[#c5c6c7]/50 text-[10px] font-black uppercase tracking-widest">Блок</span>
                <span className="text-[#00f0ff] font-black text-lg drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]">
                  {page}
                </span>
              </div>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasNext}
                className="px-5 py-2.5 bg-[#0b0c10]/80 border border-[#c5c6c7]/20 rounded-xl text-xs font-black uppercase tracking-widest text-[#c5c6c7] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#c5c6c7]/10 hover:text-white transition-all shadow-inner"
              >
                Далее
              </button>
            </div>
          )}

          {/* Back link */}
          <div className="mt-12 mb-10 flex justify-center">
            <Link
              href="/vacancies"
              className="inline-flex items-center gap-2 px-6 py-2 border border-[#c5c6c7]/20 rounded-full text-[#c5c6c7]/70 hover:text-white hover:border-[#c5c6c7]/50 hover:bg-[#1f2833]/50 transition-all font-bold tracking-widest uppercase text-[11px] shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              В основную ленту
            </Link>
          </div>
        </div>
      </main>

      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0b0c10]/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#1f2833] border border-[#c5c6c7]/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center border ${confirmModal.type === "delete"
                  ? "bg-red-500/10 border-red-500/30 text-red-500"
                  : "bg-[#ff6b00]/10 border-[#ff6b00]/30 text-[#ff6b00]"
                  }`}>
                  {confirmModal.type === "delete" ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </div>
                <h3 className="text-xl font-black text-white tracking-wide leading-tight">
                  {confirmModal.type === "delete" ? "Внимание: Удаление" : "Отозвать с модерации?"}
                </h3>
              </div>

              <div className="relative z-10">
                <p className="text-[#c5c6c7]/80 text-sm mb-4 leading-relaxed">
                  {confirmModal.type === "delete"
                    ? "Вы собираетесь навсегда уничтожить этот файл вакансии. Действие необратимо. Продолжить?"
                    : "Вы уверены, что хотите прервать процесс модерации? Вакансия вернётся в статус черновика."}
                </p>
                {confirmModal.vacancyTitle && (
                  <div className="bg-[#0b0c10]/50 border border-[#c5c6c7]/10 rounded-xl p-3 mb-8">
                    <p className="text-[10px] uppercase font-black tracking-widest text-[#c5c6c7]/40 mb-1">Цель</p>
                    <p className="font-bold text-white truncate">"{confirmModal.vacancyTitle}"</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 justify-end relative z-10">
                <button
                  onClick={() => setConfirmModal({ isOpen: false, type: null, vacancyId: null, vacancyTitle: "" })}
                  className="px-6 py-3 text-xs font-black uppercase tracking-widest text-[#c5c6c7] border border-[#c5c6c7]/20 rounded-xl hover:bg-[#c5c6c7]/10 hover:text-white transition-all shadow-inner"
                >
                  Отмена
                </button>
                <button
                  onClick={confirmModal.type === "delete" ? confirmDelete : confirmWithdraw}
                  className={`px-8 py-3 text-xs font-black uppercase tracking-widest text-[#0b0c10] rounded-xl transition-all hover:scale-[1.02] shadow-md ${confirmModal.type === "delete"
                    ? "bg-gradient-to-r from-red-500 to-red-600 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                    : "bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] hover:shadow-[0_0_20px_rgba(255,107,0,0.4)]"
                    }`}
                >
                  {confirmModal.type === "delete" ? "Уничтожить" : "Отозвать"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

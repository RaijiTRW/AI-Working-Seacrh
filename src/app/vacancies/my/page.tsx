"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/app/Header";
import { supabase } from "@/lib/supabase";
import {
  getMyVacancies,
  deleteVacancy,
  publishVacancy,
  EmployerVacancy,
} from "@/lib/api";

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

function getStatusBadge(status: string) {
  const badges: Record<string, { label: string; className: string }> = {
    draft: { label: "Черновик", className: "bg-gray-100 text-gray-600" },
    pending_review: { label: "На модерации", className: "bg-orange-100 text-orange-600" },
    published: { label: "Опубликована", className: "bg-green-100 text-green-600" },
    rejected: { label: "Отклонена", className: "bg-red-100 text-red-600" },
    closed: { label: "Закрыта", className: "bg-red-100 text-red-600" },
  };
  return badges[status] || { label: status, className: "bg-gray-100 text-gray-600" };
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
  }, [token, page]);

  const fetchVacancies = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const result = await getMyVacancies(token, page);
      setVacancies(result.vacancies);
      setTotal(result.total);
      setHasNext(result.has_next);
    } catch (error) {
      console.error("Failed to fetch vacancies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!confirm("Вы уверены, что хотите удалить эту вакансию?")) return;

    try {
      await deleteVacancy(id, token);
      fetchVacancies();
    } catch (error) {
      console.error("Failed to delete vacancy:", error);
      alert("Не удалось удалить вакансию");
    }
  };

  const handlePublish = async (id: string) => {
    if (!token) return;
    try {
      await publishVacancy(id, token);
      fetchVacancies();
    } catch (error) {
      console.error("Failed to publish vacancy:", error);
      alert("Не удалось опубликовать вакансию");
    }
  };

  if (loading && vacancies.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-24 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-6">
          {/* Vacancy Ban Notice */}
          {vacancyBanned && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-red-800 mb-1">
                    Создание вакансий заблокировано
                  </h3>
                  <p className="text-sm text-red-700 mb-2">
                    Вам запрещено создавать новые вакансии. Все ваши активные вакансии были сняты с публикации.
                  </p>
                  <div className="bg-white/60 rounded-lg p-3">
                    <p className="text-xs font-medium text-red-600 uppercase mb-1">Причина</p>
                    <p className="text-sm text-red-700">{vacancyBanReason}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Мои вакансии</h1>
              <p className="text-gray-600 mt-1">
                {total > 0 ? `${total} вакансий` : "У вас пока нет вакансий"}
              </p>
            </div>
            {!vacancyBanned && (
              <Link
                href="/vacancies/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-xl hover:bg-orange-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Создать вакансию
              </Link>
            )}
          </div>

          {/* Vacancies list */}
          {vacancies.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Нет вакансий</h3>
              <p className="text-gray-600 mb-6">Создайте свою первую вакансию, чтобы найти сотрудников</p>
              <Link
                href="/vacancies/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-xl hover:bg-orange-600 transition-colors"
              >
                Создать вакансию
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {vacancies.map((vacancy) => {
                const statusBadge = getStatusBadge(vacancy.status);
                return (
                  <div
                    key={vacancy.id}
                    className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusBadge.className}`}>
                            {statusBadge.label}
                          </span>
                          {vacancy.published_at && (
                            <span className="text-xs text-gray-500">
                              Опубликована {formatDate(vacancy.published_at)}
                            </span>
                          )}
                        </div>
                        <Link
                          href={`/vacancies/${vacancy.id}`}
                          className="text-lg font-semibold text-gray-900 hover:text-orange-600 transition-colors"
                        >
                          {vacancy.title}
                        </Link>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                      <span>{vacancy.company}</span>
                      <span>{vacancy.city}</span>
                      {formatSalary(vacancy.salary_from, vacancy.salary_to) && (
                        <span className="font-medium text-gray-900">
                          {formatSalary(vacancy.salary_from, vacancy.salary_to)}
                        </span>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {vacancy.views_count} просмотров
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {vacancy.responses_count} откликов
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                      <Link
                        href={`/vacancies/${vacancy.id}`}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Просмотр
                      </Link>
                      <Link
                        href={`/vacancies/edit/${vacancy.id}`}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Редактировать
                      </Link>
                      {vacancy.status === "draft" && !vacancyBanned && (
                        <button
                          onClick={() => handlePublish(vacancy.id)}
                          className="px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          Опубликовать
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(vacancy.id)}
                        className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-auto"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {total > 20 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-50"
              >
                Назад
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Страница {page}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasNext}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-50"
              >
                Вперёд
              </button>
            </div>
          )}

          {/* Back link */}
          <div className="mt-8">
            <Link
              href="/vacancies"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Вернуться к ленте вакансий
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

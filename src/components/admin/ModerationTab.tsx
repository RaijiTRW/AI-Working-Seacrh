"use client";

import { useEffect, useState } from "react";
import {
  getEmployerVacanciesForModeration,
  approveEmployerVacancy,
  rejectEmployerVacancy,
  toggleUserVacancies,
  EmployerVacancyModeration,
} from "@/lib/api";

interface ModerationTabProps {
  token: string;
}

export default function ModerationTab({ token }: ModerationTabProps) {
  const [status, setStatus] = useState<"pending_review" | "rejected">("pending_review");
  const [vacancies, setVacancies] = useState<EmployerVacancyModeration[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Rejection modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedVacancy, setSelectedVacancy] = useState<EmployerVacancyModeration | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Ban modal
  const [showBanModal, setShowBanModal] = useState(false);
  const [banVacancy, setBanVacancy] = useState<EmployerVacancyModeration | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banLoading, setBanLoading] = useState(false);

  useEffect(() => {
    fetchVacancies();
  }, [status, page]);

  const fetchVacancies = async () => {
    setLoading(true);
    try {
      const result = await getEmployerVacanciesForModeration(token, status, page, 20);
      setVacancies(result.vacancies);
      setTotal(result.total);
    } catch (e) {
      console.error("Failed to fetch vacancies:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (vacancyId: string) => {
    if (!confirm("Одобрить эту вакансию?")) return;

    try {
      await approveEmployerVacancy(token, vacancyId);
      alert("Вакансия одобрена и опубликована!");
      fetchVacancies();
    } catch (e) {
      console.error("Failed to approve:", e);
      alert("Ошибка при одобрении");
    }
  };

  const handleReject = async () => {
    if (!selectedVacancy || !rejectReason.trim()) {
      alert("Введите причину отклонения");
      return;
    }

    try {
      await rejectEmployerVacancy(token, selectedVacancy.id, rejectReason);
      alert("Вакансия отклонена");
      setShowRejectModal(false);
      setSelectedVacancy(null);
      setRejectReason("");
      fetchVacancies();
    } catch (e) {
      console.error("Failed to reject:", e);
      alert("Ошибка при отклонении");
    }
  };

  const handleBanUser = async () => {
    if (!banVacancy || !banReason.trim()) {
      alert("Введите причину запрета");
      return;
    }

    setBanLoading(true);
    try {
      await toggleUserVacancies(token, banVacancy.user_id, banReason);
      alert(`Пользователю запрещено создавать вакансии. Все активные вакансии сняты с публикации.`);
      setShowBanModal(false);
      setBanVacancy(null);
      setBanReason("");
      fetchVacancies();
    } catch (e) {
      console.error("Failed to ban user:", e);
      alert("Ошибка при запрете");
    } finally {
      setBanLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Модерация вакансий</h2>

        {/* Status Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              setStatus("pending_review");
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              status === "pending_review"
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            На рассмотрении
          </button>
          <button
            onClick={() => {
              setStatus("rejected");
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              status === "rejected"
                ? "bg-red-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Отклонённые
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <p className="text-sm text-gray-600">
          Всего: <span className="font-semibold text-gray-900">{total}</span>
        </p>
      </div>

      {/* Vacancies List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Загрузка...</p>
        </div>
      ) : vacancies.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Вакансий нет</p>
        </div>
      ) : (
        <div className="space-y-4">
          {vacancies.map((vacancy) => (
            <div
              key={vacancy.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {vacancy.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {vacancy.company} • {vacancy.city}
                  </p>
                  {vacancy.salary_from || vacancy.salary_to ? (
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {vacancy.salary_from && `от ${vacancy.salary_from.toLocaleString("ru-RU")}`}
                      {vacancy.salary_to && ` до ${vacancy.salary_to.toLocaleString("ru-RU")}`}
                      {" "}₽
                    </p>
                  ) : null}
                </div>

                {/* Status Badge */}
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    vacancy.status === "pending_review"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {vacancy.status === "pending_review" ? "На рассмотрении" : "Отклонено"}
                </span>
              </div>

              {/* Description */}
              <div className="mb-4 space-y-2">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                    Описание
                  </p>
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {vacancy.description}
                  </p>
                </div>

                {vacancy.requirements && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                      Требования
                    </p>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {vacancy.requirements}
                    </p>
                  </div>
                )}
              </div>

              {/* Rejection Reason */}
              {vacancy.rejection_reason && (
                <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-xs font-medium text-red-600 uppercase mb-1">
                    Причина отклонения
                  </p>
                  <p className="text-sm text-red-700">{vacancy.rejection_reason}</p>
                </div>
              )}

              {/* Employer Info */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                  Работодатель
                </p>
                <p className="text-sm text-gray-900">
                  {vacancy.profiles?.full_name || "Без имени"}
                </p>
                <p className="text-sm text-gray-600">{vacancy.profiles?.email}</p>
              </div>

              {/* Contact Info */}
              {(vacancy.contact_name || vacancy.contact_email || vacancy.contact_phone) && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                    Контакты
                  </p>
                  {vacancy.contact_name && (
                    <p className="text-sm text-gray-900">{vacancy.contact_name}</p>
                  )}
                  {vacancy.contact_email && (
                    <p className="text-sm text-gray-600">{vacancy.contact_email}</p>
                  )}
                  {vacancy.contact_phone && (
                    <p className="text-sm text-gray-600">{vacancy.contact_phone}</p>
                  )}
                </div>
              )}

              {/* Actions */}
              {status === "pending_review" && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(vacancy.id)}
                      className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                    >
                      ✓ Одобрить
                    </button>
                    <button
                      onClick={() => {
                        setSelectedVacancy(vacancy);
                        setRejectReason("");
                        setShowRejectModal(true);
                      }}
                      className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                    >
                      ✗ Отклонить
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setBanVacancy(vacancy);
                      setBanReason("");
                      setShowBanModal(true);
                    }}
                    className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium text-sm"
                  >
                    Запретить вакансии пользователю
                  </button>
                </div>
              )}

              {status === "rejected" && (
                <div className="space-y-2">
                  <button
                    onClick={() => handleApprove(vacancy.id)}
                    className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                  >
                    Одобрить и опубликовать
                  </button>
                  <button
                    onClick={() => {
                      setBanVacancy(vacancy);
                      setBanReason("");
                      setShowBanModal(true);
                    }}
                    className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium text-sm"
                  >
                    Запретить вакансии пользователю
                  </button>
                </div>
              )}

              {/* Metadata */}
              <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                Создано: {new Date(vacancy.created_at || "").toLocaleString("ru-RU")}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Назад
          </button>
          <span className="px-4 py-2 text-gray-600">
            Страница {page} из {Math.ceil(total / 20)}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(total / 20)}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Вперёд →
          </button>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedVacancy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Отклонить вакансию
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {selectedVacancy.title}
            </p>

            <label className="block mb-4">
              <span className="text-sm font-medium text-gray-700 mb-2 block">
                Причина отклонения
              </span>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Укажите причину отклонения (будет видна работодателю)"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[100px]"
              />
            </label>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedVacancy(null);
                  setRejectReason("");
                }}
                className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Отклонить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban User Modal */}
      {showBanModal && banVacancy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Запретить создание вакансий
                </h3>
                <p className="text-sm text-gray-500">
                  {banVacancy.profiles?.full_name || banVacancy.profiles?.email || "Пользователь"}
                </p>
              </div>
            </div>

            <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                Все активные и ожидающие модерации вакансии этого пользователя будут сняты с публикации и переведены в черновик. Пользователь больше не сможет создавать новые вакансии.
              </p>
            </div>

            <label className="block mb-4">
              <span className="text-sm font-medium text-gray-700 mb-2 block">
                Причина запрета
              </span>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Укажите причину запрета (будет видна пользователю)"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[100px]"
              />
            </label>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowBanModal(false);
                  setBanVacancy(null);
                  setBanReason("");
                }}
                className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleBanUser}
                disabled={!banReason.trim() || banLoading}
                className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {banLoading ? "Запрет..." : "Запретить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

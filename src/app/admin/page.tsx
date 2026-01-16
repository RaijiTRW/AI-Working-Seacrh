"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  getAdminStats,
  getAdminUsers,
  getSiteSettings,
  updateSiteSetting,
  banUser,
  unbanUser,
  toggleUserVacancies,
  setUserSubscription,
  setUserRole,
  AdminStats,
  AdminUser,
  SiteSetting,
} from "@/lib/api";
import SchedulerTab from "@/components/admin/SchedulerTab";
import SupportChatTab from "@/components/admin/SupportChatTab";

type Tab = "stats" | "users" | "settings" | "scheduler" | "support";

export default function AdminPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("stats");

  // Data
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [settings, setSettings] = useState<SiteSetting[]>([]);

  // Modal
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionType, setSubscriptionType] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth");
        return;
      }

      const accessToken = session.access_token;
      setToken(accessToken);

      // Try to fetch admin stats to verify admin access
      try {
        const adminStats = await getAdminStats(accessToken);
        setStats(adminStats);
        setLoading(false);
      } catch {
        // Not an admin
        router.push("/profile");
      }
    };

    checkAuth();
  }, [router]);

  // Fetch users when tab changes or page changes
  useEffect(() => {
    if (activeTab === "users" && token) {
      fetchUsers();
    }
  }, [activeTab, usersPage, token]);

  // Fetch settings when tab changes
  useEffect(() => {
    if (activeTab === "settings" && token) {
      fetchSettings();
    }
  }, [activeTab, token]);

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const result = await getAdminUsers(token, usersPage, 20, searchQuery);
      setUsers(result.users);
      setUsersTotal(result.total);
    } catch (e) {
      console.error("Failed to fetch users:", e);
    }
  };

  const fetchSettings = async () => {
    if (!token) return;
    try {
      const result = await getSiteSettings(token);
      setSettings(result);
    } catch (e) {
      console.error("Failed to fetch settings:", e);
    }
  };

  const handleSearch = () => {
    setUsersPage(1);
    fetchUsers();
  };

  const handleBan = async () => {
    if (!token || !selectedUser) return;
    try {
      await banUser(token, selectedUser.id, banReason);
      setShowBanModal(false);
      setBanReason("");
      fetchUsers();
    } catch (e) {
      console.error("Failed to ban user:", e);
    }
  };

  const handleUnban = async (userId: string) => {
    if (!token) return;
    try {
      await unbanUser(token, userId);
      fetchUsers();
    } catch (e) {
      console.error("Failed to unban user:", e);
    }
  };

  const handleToggleVacancies = async (user: AdminUser) => {
    if (!token) return;
    try {
      await toggleUserVacancies(token, user.id, !user.can_create_vacancies);
      fetchUsers();
    } catch (e) {
      console.error("Failed to toggle vacancies:", e);
    }
  };

  const handleSetSubscription = async () => {
    if (!token || !selectedUser) return;
    try {
      await setUserSubscription(token, selectedUser.id, subscriptionType);
      setShowSubscriptionModal(false);
      setSubscriptionType("");
      fetchUsers();
    } catch (e) {
      console.error("Failed to set subscription:", e);
    }
  };

  const handleToggleAdmin = async (user: AdminUser) => {
    if (!token) return;
    const newRole = user.role === "admin" ? "user" : "admin";
    try {
      await setUserRole(token, user.id, newRole);
      fetchUsers();
    } catch (e) {
      console.error("Failed to set role:", e);
    }
  };

  const handleToggleSetting = async (setting: SiteSetting) => {
    if (!token) return;
    try {
      await updateSiteSetting(token, setting.id, !setting.value.enabled);
      fetchSettings();
    } catch (e) {
      console.error("Failed to update setting:", e);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const settingLabels: Record<string, string> = {
    registration_enabled: "Регистрация",
    chat_enabled: "AI-чат",
    vacancies_enabled: "Лента вакансий",
    vacancy_creation_enabled: "Создание вакансий",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Job Search
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/vacancies"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Вакансии
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/messages"
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="hidden sm:inline">Сообщения</span>
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="hidden sm:inline">Профиль</span>
              </Link>
              <span className="flex items-center gap-2 px-4 py-2.5 bg-red-100 text-red-600 rounded-full text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <span className="hidden sm:inline">Админ</span>
              </span>
            </div>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Администрирование</h1>
          <p className="text-gray-500 mt-1">Управление пользователями и настройками сайта</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { id: "stats" as Tab, label: "Статистика" },
            { id: "users" as Tab, label: "Пользователи" },
            { id: "support" as Tab, label: "Чат поддержки" },
            { id: "settings" as Tab, label: "Настройки" },
            { id: "scheduler" as Tab, label: "Парсинг" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-orange-500 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Stats Tab */}
        {activeTab === "stats" && stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="text-3xl font-bold text-gray-900">{stats.total_users}</div>
              <div className="text-sm text-gray-500 mt-1">Всего пользователей</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="text-3xl font-bold text-green-500">{stats.online_users}</div>
              <div className="text-sm text-gray-500 mt-1">Онлайн сейчас</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="text-3xl font-bold text-red-500">{stats.banned_users}</div>
              <div className="text-sm text-gray-500 mt-1">Забанено</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="text-3xl font-bold text-orange-500">{stats.admins_count}</div>
              <div className="text-sm text-gray-500 mt-1">Админов</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="text-3xl font-bold text-blue-500">{stats.platform_vacancies}</div>
              <div className="text-sm text-gray-500 mt-1">Наших вакансий</div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="bg-white rounded-xl border border-gray-200">
            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Поиск по email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Найти
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Роль</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Статус</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Подписка</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Был онлайн</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{user.email}</div>
                        {user.full_name && (
                          <div className="text-sm text-gray-500">{user.full_name}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                            user.role === "admin"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {user.role === "admin" ? "Админ" : "Пользователь"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {user.is_banned ? (
                          <span className="inline-flex px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                            Забанен
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                            Активен
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {user.subscription_type || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(user.last_seen_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {user.is_banned ? (
                            <button
                              onClick={() => handleUnban(user.id)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                              title="Разбанить"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowBanModal(true);
                              }}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                              title="Забанить"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => handleToggleVacancies(user)}
                            className={`p-1.5 rounded ${
                              user.can_create_vacancies
                                ? "text-orange-600 hover:bg-orange-50"
                                : "text-gray-400 hover:bg-gray-50"
                            }`}
                            title={user.can_create_vacancies ? "Запретить вакансии" : "Разрешить вакансии"}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setSubscriptionType(user.subscription_type || "");
                              setShowSubscriptionModal(true);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="Подписка"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleToggleAdmin(user)}
                            className={`p-1.5 rounded ${
                              user.role === "admin"
                                ? "text-red-600 hover:bg-red-50"
                                : "text-gray-400 hover:bg-gray-50"
                            }`}
                            title={user.role === "admin" ? "Убрать админа" : "Сделать админом"}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {usersTotal > 20 && (
              <div className="p-4 border-t border-gray-200 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Показано {(usersPage - 1) * 20 + 1}-{Math.min(usersPage * 20, usersTotal)} из {usersTotal}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                    disabled={usersPage === 1}
                    className="px-3 py-1 border border-gray-200 rounded text-sm disabled:opacity-50"
                  >
                    Назад
                  </button>
                  <button
                    onClick={() => setUsersPage((p) => p + 1)}
                    disabled={usersPage * 20 >= usersTotal}
                    className="px-3 py-1 border border-gray-200 rounded text-sm disabled:opacity-50"
                  >
                    Вперёд
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-200">
            {settings.map((setting) => (
              <div
                key={setting.id}
                className="flex items-center justify-between p-4"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {settingLabels[setting.id] || setting.id}
                  </div>
                  <div className="text-sm text-gray-500">
                    {setting.value.enabled ? "Включено" : "Выключено"}
                  </div>
                </div>
                <button
                  onClick={() => handleToggleSetting(setting)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    setting.value.enabled ? "bg-orange-500" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      setting.value.enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Scheduler Tab */}
        {activeTab === "scheduler" && token && (
          <SchedulerTab token={token} />
        )}

        {/* Support Chat Tab */}
        {activeTab === "support" && token && (
          <SupportChatTab token={token} />
        )}
      </main>

      {/* Ban Modal */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Забанить пользователя
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {selectedUser?.email}
            </p>
            <textarea
              placeholder="Причина бана (опционально)"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none h-24"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowBanModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Отмена
              </button>
              <button
                onClick={handleBan}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Забанить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Установить подписку
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {selectedUser?.email}
            </p>
            <select
              value={subscriptionType}
              onChange={(e) => setSubscriptionType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Без подписки</option>
              <option value="trial">Trial (3 запроса/день)</option>
              <option value="pro">Pro (10 запросов/день)</option>
            </select>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowSubscriptionModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Отмена
              </button>
              <button
                onClick={handleSetSubscription}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

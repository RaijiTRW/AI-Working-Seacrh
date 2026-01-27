"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/landing/Header";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/lib/supabase";
import { createVacancy, publishVacancy, EmployerVacancyCreate } from "@/lib/api";
import { useSiteSettings } from "@/lib/useSiteSettings";

const EXPERIENCE_OPTIONS = [
  { value: "", label: "Не указан" },
  { value: "no_experience", label: "Без опыта" },
  { value: "1-3", label: "1-3 года" },
  { value: "3-6", label: "3-6 лет" },
  { value: "6+", label: "Более 6 лет" },
];

const EMPLOYMENT_OPTIONS = [
  { value: "", label: "Не указан" },
  { value: "full", label: "Полная занятость" },
  { value: "part", label: "Частичная занятость" },
  { value: "project", label: "Проектная работа" },
  { value: "internship", label: "Стажировка" },
];

const SCHEDULE_OPTIONS = [
  { value: "", label: "Не указан" },
  { value: "fullDay", label: "Полный день" },
  { value: "shift", label: "Сменный график" },
  { value: "flexible", label: "Гибкий график" },
  { value: "remote", label: "Удаленная работа" },
];

export default function CreateVacancyPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { settings, loading: settingsLoading } = useSiteSettings();
  const [isAdmin, setIsAdmin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [vacancyBanned, setVacancyBanned] = useState(false);
  const [vacancyBanReason, setVacancyBanReason] = useState("");

  const [formData, setFormData] = useState<EmployerVacancyCreate>({
    title: "",
    company: "",
    city: "",
    salary_from: undefined,
    salary_to: undefined,
    salary_currency: "RUB",
    experience: "",
    employment_type: "",
    schedule: "",
    description: "",
    requirements: "",
    conditions: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const checkProfile = async () => {
      if (user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, can_create_vacancies, vacancy_ban_reason")
          .eq("user_id", user.id)
          .single();

        setIsAdmin(profile?.role === "admin");

        if (profile?.can_create_vacancies === false) {
          setVacancyBanned(true);
          setVacancyBanReason(profile.vacancy_ban_reason || "Нарушение правил публикации");
        }
      }
    };
    checkProfile();
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value ? parseInt(value) : undefined,
    }));
  };

  const handleSubmit = async (e: React.FormEvent, publish = false) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        setError("Необходимо авторизоваться");
        return;
      }

      // Validate required fields
      if (!formData.title || formData.title.length < 3) {
        setError("Название должно быть минимум 3 символа");
        return;
      }
      if (!formData.company) {
        setError("Укажите название компании");
        return;
      }
      if (!formData.city) {
        setError("Укажите город");
        return;
      }
      if (!formData.description || formData.description.length < 50) {
        setError("Описание должно быть минимум 50 символов");
        return;
      }

      const vacancy = await createVacancy(formData, token);

      if (publish) {
        await publishVacancy(vacancy.id, token);
      }

      router.push("/vacancies");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка при создании вакансии");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || settingsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (vacancyBanned && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20">
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Создание вакансий заблокировано
            </h1>
            <p className="text-gray-600 mb-4">
              Вам запрещено создавать вакансии администратором.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left">
              <p className="text-xs font-medium text-red-600 uppercase mb-1">Причина</p>
              <p className="text-sm text-red-700">{vacancyBanReason}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!settings.vacancy_creation_enabled && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20">
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Создание вакансий временно недоступно
            </h1>
            <p className="text-gray-600">
              Функция отключена администратором. Пожалуйста, попробуйте позже.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-24 pb-12">
        <div className="max-w-3xl mx-auto px-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Создать вакансию</h1>
            <p className="text-gray-600 mt-1">
              Заполните информацию о вакансии для публикации на платформе
            </p>
          </div>

          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            {/* Basic info */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Основная информация
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название вакансии *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Например: Frontend-разработчик"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Компания *
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Название вашей компании"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Город *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Москва"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Salary */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Зарплата
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    От
                  </label>
                  <input
                    type="number"
                    name="salary_from"
                    value={formData.salary_from || ""}
                    onChange={handleNumberChange}
                    placeholder="50000"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    До
                  </label>
                  <input
                    type="number"
                    name="salary_to"
                    value={formData.salary_to || ""}
                    onChange={handleNumberChange}
                    placeholder="100000"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Work conditions */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Условия работы
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Опыт работы
                  </label>
                  <select
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                  >
                    {EXPERIENCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Тип занятости
                  </label>
                  <select
                    name="employment_type"
                    value={formData.employment_type}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                  >
                    {EMPLOYMENT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    График
                  </label>
                  <select
                    name="schedule"
                    value={formData.schedule}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                  >
                    {SCHEDULE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Описание
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Описание вакансии *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Опишите, чем предстоит заниматься..."
                    rows={5}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Минимум 50 символов
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Требования
                  </label>
                  <textarea
                    name="requirements"
                    value={formData.requirements}
                    onChange={handleChange}
                    placeholder="Что должен знать и уметь кандидат..."
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Условия
                  </label>
                  <textarea
                    name="conditions"
                    value={formData.conditions}
                    onChange={handleChange}
                    placeholder="Что предлагаете сотруднику..."
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Contacts */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Контакты
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Контактное лицо
                  </label>
                  <input
                    type="text"
                    name="contact_name"
                    value={formData.contact_name}
                    onChange={handleChange}
                    placeholder="Иван Иванов"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleChange}
                    placeholder="hr@company.ru"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Телефон
                  </label>
                  <input
                    type="tel"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleChange}
                    placeholder="+7 (999) 123-45-67"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Сохранение..." : "Опубликовать"}
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Сохранение..." : "Сохранить как черновик"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

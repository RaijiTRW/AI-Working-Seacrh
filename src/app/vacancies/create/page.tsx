"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/landing/Header";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/lib/supabase";
import { createVacancy, publishVacancy, EmployerVacancyCreate, SalaryType, SalaryTaxType, SalaryPeriod, ContractType, WorkFormat, OvertimePolicy, GradeLevel, WorkHoursType, Responsibility } from "@/lib/api";
import { useSiteSettings } from "@/lib/useSiteSettings";

// === Старые опции (для обратной совместимости) ===
const EXPERIENCE_OPTIONS = [
  { value: "", label: "Не указан" },
  { value: "no_experience", label: "Не требуется" },
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
  { value: "shift", label: "Сменный (2/2, 3/3 и т.д.)" },
  { value: "flexible", label: "Гибкий график" },
  { value: "remote", label: "Удаленная работа" },
];

// === Новые опции для структурированного оффера ===

const SALARY_TYPE_OPTIONS = [
  { value: "fix", label: "Фиксированная" },
  { value: "range", label: "Вилка" },
  { value: "bonuses", label: "Только бонусы" },
  { value: "kpi", label: "Только KPI" },
];

const SALARY_TAX_TYPE_OPTIONS = [
  { value: "net", label: "На руки (после вычета НДФЛ)" },
  { value: "gross", label: "До вычета НДФЛ (gross)" },
];

const SALARY_PERIOD_OPTIONS = [
  { value: "month", label: "В месяц" },
  { value: "week", label: "В неделю" },
  { value: "day", label: "В день" },
  { value: "hour", label: "В час" },
  { value: "shift", label: "За смену" },
  { value: "project", label: "За проект" },
];

const CONTRACT_TYPE_OPTIONS = [
  { value: "labor_rf", label: "ТК РФ" },
  { value: "gph", label: "ГПХ договор" },
  { value: "ip", label: "ИП" },
  { value: "self_employed", label: "Самозанятый" },
];

const WORK_FORMAT_OPTIONS = [
  { value: "office", label: "В офисе" },
  { value: "remote", label: "Удалённо" },
  { value: "hybrid", label: "Гибрид" },
];

const WORK_HOURS_TYPE_OPTIONS = [
  { value: "per_day", label: "Часов в день" },
  { value: "per_week", label: "Часов в неделю" },
  { value: "range", label: "Время с-до" },
];

const OVERTIME_POLICY_OPTIONS = [
  { value: "paid", label: "Оплачиваются" },
  { value: "unpaid", label: "Не оплачиваются" },
  { value: "negotiable", label: "По договорённости" },
];

const GRADE_LEVEL_OPTIONS = [
  { value: "", label: "Не указан" },
  { value: "intern", label: "Intern / Стажёр" },
  { value: "junior", label: "Junior / Младший" },
  { value: "middle", label: "Middle / Средний" },
  { value: "senior", label: "Senior / Старший" },
  { value: "lead", label: "Lead / Ведущий" },
  { value: "principal", label: "Principal / Главный" },
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

  const [formData, setFormData] = useState<{
    // Старые поля (для обратной совместимости)
    title: string;
    company: string;
    city: string;
    salary_from?: number;
    salary_to?: number;
    salary_currency: string;
    experience?: string;
    employment_type?: string;
    schedule?: string;
    description: string;
    requirements?: string;
    conditions?: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
    // Новые поля структурированного оффера
    salary_type: SalaryType;
    salary_tax_type: SalaryTaxType;
    salary_period: SalaryPeriod;
    salary_bonuses_enabled: boolean;
    salary_bonuses_description?: string;
    salary_kpi_enabled: boolean;
    salary_kpi_description?: string;
    salary_kpi_max_percentage?: number;
    contract_type: ContractType;
    contract_comment?: string;
    work_format: WorkFormat;
    work_hours_type: WorkHoursType;
    work_hours_value?: number;
    work_hours_from?: string;
    work_hours_to?: string;
    overtime_policy: OvertimePolicy;
    probation_enabled: boolean;
    probation_months?: number;
    probation_salary_reduction?: number;
    tech_stack: string[];
    grade_level?: GradeLevel;
    responsibilities: Responsibility[];
  }>({
    // Старые поля
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
    // Новые поля с дефолтными значениями
    salary_type: "range",
    salary_tax_type: "net",
    salary_period: "month",
    salary_bonuses_enabled: false,
    salary_kpi_enabled: false,
    contract_type: "labor_rf",
    work_format: "office",
    work_hours_type: "per_day",
    work_hours_value: 8,
    overtime_policy: "unpaid",
    probation_enabled: true,
    probation_months: 3,
    probation_salary_reduction: 0,
    tech_stack: [],
    grade_level: "",
    responsibilities: [{ text: "", order: 1 }],
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

      // Подготовка данных для отправки в API формате
      const vacancyData: EmployerVacancyCreate = {
        title: formData.title,
        company: formData.company,
        city: formData.city,
        salary_from: formData.salary_from,
        salary_to: formData.salary_to,
        salary_currency: formData.salary_currency,
        experience: formData.experience,
        employment_type: formData.employment_type,
        schedule: formData.schedule,
        description: formData.description,
        requirements: formData.requirements,
        conditions: formData.conditions,
        contact_name: formData.contact_name,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        // Новые поля
        salary_type: formData.salary_type,
        salary_tax_type: formData.salary_tax_type,
        salary_period: formData.salary_period,
        salary_bonuses: formData.salary_bonuses_enabled
          ? { enabled: true, description: formData.salary_bonuses_description }
          : { enabled: false },
        salary_kpi: formData.salary_kpi_enabled
          ? { enabled: true, description: formData.salary_kpi_description, max_percentage: formData.salary_kpi_max_percentage }
          : { enabled: false },
        contract_type: formData.contract_type,
        contract_comment: formData.contract_comment,
        work_format: formData.work_format,
        work_hours: {
          type: formData.work_hours_type,
          hours: formData.work_hours_value,
          from: formData.work_hours_from,
          to: formData.work_hours_to,
        },
        overtime_policy: formData.overtime_policy,
        probation_months: formData.probation_enabled ? (formData.probation_months ?? 3) : 0,
        probation_salary_reduction: formData.probation_enabled ? (formData.probation_salary_reduction ?? 0) : 0,
        tech_stack: formData.tech_stack.filter(s => s.trim() !== ""),
        grade_level: formData.grade_level || undefined,
        responsibilities: formData.responsibilities.filter(r => r.text.trim() !== ""),
      };

      const vacancy = await createVacancy(vacancyData, token);

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

            {/* Salary - структурированная */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Зарплата
              </h2>

              <div className="space-y-4">
                {/* Тип зарплаты */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Тип зарплаты *
                  </label>
                  <select
                    name="salary_type"
                    value={formData.salary_type}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                  >
                    {SALARY_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Gross/Net */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    До вычета налогов или на руки *
                  </label>
                  <select
                    name="salary_tax_type"
                    value={formData.salary_tax_type}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                  >
                    {SALARY_TAX_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Периодичность */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Периодичность выплат *
                  </label>
                  <select
                    name="salary_period"
                    value={formData.salary_period}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                  >
                    {SALARY_PERIOD_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Сумма (для fix и range) */}
                {(formData.salary_type === "fix" || formData.salary_type === "range") && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {formData.salary_type === "fix" ? "Сумма" : "От"}
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
                    {formData.salary_type === "range" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">До</label>
                        <input
                          type="number"
                          name="salary_to"
                          value={formData.salary_to || ""}
                          onChange={handleNumberChange}
                          placeholder="100000"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Бонусы */}
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id="bonuses_enabled"
                      checked={formData.salary_bonuses_enabled}
                      onChange={(e) => setFormData({ ...formData, salary_bonuses_enabled: e.target.checked })}
                      className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    <label htmlFor="bonuses_enabled" className="text-sm font-medium text-gray-700">
                      Есть бонусы
                    </label>
                  </div>
                  {formData.salary_bonuses_enabled && (
                    <input
                      type="text"
                      name="salary_bonuses_description"
                      value={formData.salary_bonuses_description || ""}
                      onChange={handleChange}
                      placeholder="Опишите бонусы (например, годовой бонус до 3 окладов)"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  )}
                </div>

                {/* KPI */}
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id="kpi_enabled"
                      checked={formData.salary_kpi_enabled}
                      onChange={(e) => setFormData({ ...formData, salary_kpi_enabled: e.target.checked })}
                      className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    <label htmlFor="kpi_enabled" className="text-sm font-medium text-gray-700">
                      Есть KPI
                    </label>
                  </div>
                  {formData.salary_kpi_enabled && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        name="salary_kpi_description"
                        value={formData.salary_kpi_description || ""}
                        onChange={handleChange}
                        placeholder="Опишите KPI"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        name="salary_kpi_max_percentage"
                        value={formData.salary_kpi_max_percentage || ""}
                        onChange={handleNumberChange}
                        placeholder="Максимальный % от оклада"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contract Type - новая секция */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Тип договора
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Тип *
                  </label>
                  <select
                    name="contract_type"
                    value={formData.contract_type}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                  >
                    {CONTRACT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Комментарий
                  </label>
                  <input
                    type="text"
                    name="contract_comment"
                    value={formData.contract_comment || ""}
                    onChange={handleChange}
                    placeholder="Дополнительная информация о договоре"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Work Schedule - расширенная секция */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                График работы
              </h2>

              <div className="space-y-4">
                {/* Формат работы */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Формат *
                  </label>
                  <select
                    name="work_format"
                    value={formData.work_format}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                  >
                    {WORK_FORMAT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Часы работы */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Часы работы *
                  </label>
                  <select
                    name="work_hours_type"
                    value={formData.work_hours_type}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white mb-2"
                  >
                    {WORK_HOURS_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {(formData.work_hours_type === "per_day" || formData.work_hours_type === "per_week") && (
                    <input
                      type="number"
                      name="work_hours_value"
                      value={formData.work_hours_value || ""}
                      onChange={handleNumberChange}
                      placeholder={formData.work_hours_type === "per_day" ? "8" : "40"}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  )}
                  {formData.work_hours_type === "range" && (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="time"
                        name="work_hours_from"
                        value={formData.work_hours_from || ""}
                        onChange={handleChange}
                        className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                      <input
                        type="time"
                        name="work_hours_to"
                        value={formData.work_hours_to || ""}
                        onChange={handleChange}
                        className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>

                {/* Переработки */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Переработки *
                  </label>
                  <select
                    name="overtime_policy"
                    value={formData.overtime_policy}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                  >
                    {OVERTIME_POLICY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Old work conditions (для обратной совместимости) */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Дополнительно (старые поля)
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
                    График (старый)
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

            {/* Probation Period - новая секция */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Испытательный срок
              </h2>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="probation_enabled"
                    checked={formData.probation_enabled}
                    onChange={(e) => setFormData({ ...formData, probation_enabled: e.target.checked })}
                    className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <label htmlFor="probation_enabled" className="text-sm font-medium text-gray-700">
                    Есть испытательный срок
                  </label>
                </div>

                {formData.probation_enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Длительность (месяцев)
                      </label>
                      <input
                        type="number"
                        name="probation_months"
                        value={formData.probation_months || 3}
                        onChange={handleNumberChange}
                        min="0"
                        max="12"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Снижение ЗП (%)
                      </label>
                      <input
                        type="number"
                        name="probation_salary_reduction"
                        value={formData.probation_salary_reduction || 0}
                        onChange={handleNumberChange}
                        min="0"
                        max="50"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tech Stack - новая секция */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Технический стек
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Технологии
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tech_stack.map((tech, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full flex items-center gap-1"
                    >
                      {tech}
                      <button
                        type="button"
                        onClick={() => {
                          const newStack = formData.tech_stack.filter((_, i) => i !== index);
                          setFormData({ ...formData, tech_stack: newStack });
                        }}
                        className="text-orange-500 hover:text-orange-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Введите технологию и нажмите Enter"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const value = (e.target as HTMLInputElement).value.trim();
                      if (value && !formData.tech_stack.includes(value)) {
                        setFormData({ ...formData, tech_stack: [...formData.tech_stack, value] });
                      }
                      (e.target as HTMLInputElement).value = "";
                    }
                  }}
                />
              </div>
            </div>

            {/* Grade Level - новая секция */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Уровень позиции
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Грейд
                </label>
                <select
                  name="grade_level"
                  value={formData.grade_level || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                >
                  {GRADE_LEVEL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
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
                className="flex-1 px-6 py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting && (
                  <svg className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                )}
                {submitting ? "Отправка..." : "Опубликовать"}
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting && (
                  <svg className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full" />
                )}
                {submitting ? "Сохранение..." : "Сохранить как черновик"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

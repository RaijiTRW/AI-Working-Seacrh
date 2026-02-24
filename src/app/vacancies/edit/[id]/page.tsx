"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/app/Header";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/lib/supabase";
import { getVacancyById, updateVacancy, publishVacancy, EmployerVacancyCreate } from "@/lib/api";
import { motion } from "framer-motion";

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

export default function EditVacancyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [vacancyStatus, setVacancyStatus] = useState("draft");

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
    if (id) {
      loadVacancy();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadVacancy = async () => {
    try {
      const vacancy = await getVacancyById(id);
      setFormData({
        title: vacancy.title || "",
        company: vacancy.company || "",
        city: vacancy.city || "",
        salary_from: vacancy.salary_from,
        salary_to: vacancy.salary_to,
        salary_currency: vacancy.salary_currency || "RUB",
        experience: vacancy.experience || "",
        employment_type: vacancy.employment_type || "",
        schedule: vacancy.schedule || "",
        description: vacancy.description || "",
        requirements: vacancy.requirements || "",
        conditions: vacancy.conditions || "",
        contact_name: vacancy.contact_name || "",
        contact_email: vacancy.contact_email || "",
        contact_phone: vacancy.contact_phone || "",
      });
      setVacancyStatus(vacancy.status);
    } catch {
      setError("Вакансия не найдена");
    } finally {
      setLoading(false);
    }
  };

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

      await updateVacancy(id, formData, token);

      if (publish && vacancyStatus === "draft") {
        await publishVacancy(id, token);
      }

      router.push("/vacancies/my");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка при сохранении");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[100dvh] bg-[#0b0c10] relative">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 pointer-events-none" />
        <Header />
        <div className="pt-32 flex flex-col items-center justify-center relative z-10 space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-[#ff6b00] border-t-transparent rounded-full shadow-[0_0_15px_rgba(255,107,0,0.5)]" />
          <p className="text-[#c5c6c7] font-bold tracking-widest uppercase text-xs animate-pulse">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (error && !formData.title) {
    return (
      <div className="min-h-[100dvh] bg-[#0b0c10] relative">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 pointer-events-none" />
        <Header />
        <main className="pt-32 pb-16 relative z-10 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto bg-red-500/10 border border-red-500/30 rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(239,68,68,0.15)] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="w-20 h-20 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide mb-3 relative z-10 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
              Ошибка доступа
            </h1>
            <p className="text-red-400 font-medium mb-8 max-w-md mx-auto relative z-10">{error}</p>
            <button
              onClick={() => router.push("/vacancies/my")}
              className="px-8 py-3.5 bg-red-500 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-red-600 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] relative z-10 disabled:opacity-50"
            >
              Вернуться в терминал
            </button>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#0b0c10] relative">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 pointer-events-none" />
      <Header />

      <main className="pt-24 sm:pt-32 pb-16 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 text-center sm:text-left"
          >
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-wide flex items-center justify-center sm:justify-start gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.8)]" />
              Модификация данных
            </h1>
            <p className="text-[#c5c6c7]/60 mt-2 font-medium tracking-wide">
              Корректировка спецификации для оптимизации поисковой выдачи
            </p>
          </motion.div>

          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-8">
            {/* Basic info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#1f2833]/60 backdrop-blur-xl rounded-3xl border border-[#c5c6c7]/10 p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.3)] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#00f0ff]/5 to-transparent rounded-bl-full pointer-events-none" />

              <h2 className="text-xl font-black text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                <svg className="w-5 h-5 text-[#ff6b00]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Базовые данные
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#c5c6c7]/70 mb-2 ml-1">
                    Название вакансии <span className="text-[#ff6b00]">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Например: Frontend-разработчик"
                    className="w-full px-5 py-3.5 bg-[#0b0c10]/50 border border-[#c5c6c7]/10 rounded-xl text-white placeholder:text-[#c5c6c7]/30 focus:outline-none focus:ring-0 focus:border-[#ff6b00]/50 focus:bg-[#0b0c10]/80 transition-all font-medium"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-[#c5c6c7]/70 mb-2 ml-1">
                      Компания <span className="text-[#ff6b00]">*</span>
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      placeholder="Название вашей компании"
                      className="w-full px-5 py-3.5 bg-[#0b0c10]/50 border border-[#c5c6c7]/10 rounded-xl text-white placeholder:text-[#c5c6c7]/30 focus:outline-none focus:ring-0 focus:border-[#00f0ff]/50 focus:bg-[#0b0c10]/80 transition-all font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-[#c5c6c7]/70 mb-2 ml-1">
                      Город / Локация <span className="text-[#ff6b00]">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Москва / Удаленно"
                      className="w-full px-5 py-3.5 bg-[#0b0c10]/50 border border-[#c5c6c7]/10 rounded-xl text-white placeholder:text-[#c5c6c7]/30 focus:outline-none focus:ring-0 focus:border-[#00f0ff]/50 focus:bg-[#0b0c10]/80 transition-all font-medium"
                      required
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Salary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-[#1f2833]/60 backdrop-blur-xl rounded-3xl border border-[#c5c6c7]/10 p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.3)] relative overflow-hidden"
            >
              <h2 className="text-xl font-black text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                <svg className="w-5 h-5 text-[#ff6b00]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Монетизация
              </h2>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#c5c6c7]/70 mb-2 ml-1 flex items-center gap-2">
                    Нижний лимит <span className="text-xs text-[#c5c6c7]/30 normal-case font-medium border border-[#c5c6c7]/10 px-1.5 py-0.5 rounded ml-auto">RUB</span>
                  </label>
                  <input
                    type="number"
                    name="salary_from"
                    value={formData.salary_from || ""}
                    onChange={handleNumberChange}
                    placeholder="150000"
                    className="w-full px-5 py-3.5 bg-[#0b0c10]/50 border border-[#c5c6c7]/10 rounded-xl text-white placeholder:text-[#c5c6c7]/30 focus:outline-none focus:ring-0 focus:border-[#00ff88]/50 focus:bg-[#0b0c10]/80 transition-all font-medium font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#c5c6c7]/70 mb-2 ml-1 flex items-center gap-2">
                    Верхний лимит <span className="text-xs text-[#c5c6c7]/30 normal-case font-medium border border-[#c5c6c7]/10 px-1.5 py-0.5 rounded ml-auto">RUB</span>
                  </label>
                  <input
                    type="number"
                    name="salary_to"
                    value={formData.salary_to || ""}
                    onChange={handleNumberChange}
                    placeholder="250000"
                    className="w-full px-5 py-3.5 bg-[#0b0c10]/50 border border-[#c5c6c7]/10 rounded-xl text-white placeholder:text-[#c5c6c7]/30 focus:outline-none focus:ring-0 focus:border-[#00ff88]/50 focus:bg-[#0b0c10]/80 transition-all font-medium font-mono"
                  />
                </div>
              </div>
            </motion.div>

            {/* Work conditions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#1f2833]/60 backdrop-blur-xl rounded-3xl border border-[#c5c6c7]/10 p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.3)] relative overflow-hidden"
            >
              <h2 className="text-xl font-black text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                <svg className="w-5 h-5 text-[#00f0ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                Формат кооперации
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#c5c6c7]/70 mb-2 ml-1">
                    Опыт <span className="text-[#ff6b00]/50">*</span>
                  </label>
                  <select
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 bg-[#0b0c10]/80 border border-[#c5c6c7]/10 rounded-xl text-white focus:outline-none focus:ring-0 focus:border-[#ff6b00]/50 transition-all font-medium appearance-none cursor-pointer"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23c5c6c7' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 1rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
                  >
                    {EXPERIENCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-[#1f2833] text-white">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#c5c6c7]/70 mb-2 ml-1">
                    Занятость <span className="text-[#ff6b00]/50">*</span>
                  </label>
                  <select
                    name="employment_type"
                    value={formData.employment_type}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 bg-[#0b0c10]/80 border border-[#c5c6c7]/10 rounded-xl text-white focus:outline-none focus:ring-0 focus:border-[#ff6b00]/50 transition-all font-medium appearance-none cursor-pointer"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23c5c6c7' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 1rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
                  >
                    {EMPLOYMENT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-[#1f2833] text-white">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#c5c6c7]/70 mb-2 ml-1">
                    График <span className="text-[#ff6b00]/50">*</span>
                  </label>
                  <select
                    name="schedule"
                    value={formData.schedule}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 bg-[#0b0c10]/80 border border-[#c5c6c7]/10 rounded-xl text-white focus:outline-none focus:ring-0 focus:border-[#ff6b00]/50 transition-all font-medium appearance-none cursor-pointer"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23c5c6c7' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 1rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
                  >
                    {SCHEDULE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-[#1f2833] text-white">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-[#1f2833]/60 backdrop-blur-xl rounded-3xl border border-[#c5c6c7]/10 p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.3)] relative overflow-hidden"
            >
              <h2 className="text-xl font-black text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                <svg className="w-5 h-5 text-[#c5c6c7]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                Спецификация
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#c5c6c7]/70 mb-2 ml-1">
                    Суть задач <span className="text-[#ff6b00]">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Детальное описание зоны ответственности и повседневных задач..."
                    rows={6}
                    className="w-full px-5 py-4 bg-[#0b0c10]/50 border border-[#c5c6c7]/10 rounded-xl text-white placeholder:text-[#c5c6c7]/30 focus:outline-none focus:ring-0 focus:border-[#ff6b00]/50 focus:bg-[#0b0c10]/80 transition-all font-medium resize-none leading-relaxed"
                    required
                  />
                  <p className="text-[10px] font-bold tracking-widest uppercase text-[#c5c6c7]/40 mt-2 px-1 text-right">
                    Минимум 50 символов
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#c5c6c7]/70 mb-2 ml-1">
                    Стек и требования
                  </label>
                  <textarea
                    name="requirements"
                    value={formData.requirements}
                    onChange={handleChange}
                    placeholder="Технологии, хард и софт скиллы кандидата..."
                    rows={4}
                    className="w-full px-5 py-4 bg-[#0b0c10]/50 border border-[#c5c6c7]/10 rounded-xl text-white placeholder:text-[#c5c6c7]/30 focus:outline-none focus:ring-0 focus:border-[#00f0ff]/50 focus:bg-[#0b0c10]/80 transition-all font-medium resize-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#c5c6c7]/70 mb-2 ml-1">
                    Что мы предлагаем
                  </label>
                  <textarea
                    name="conditions"
                    value={formData.conditions}
                    onChange={handleChange}
                    placeholder="Печеньки, ДМС, техника, опционы..."
                    rows={4}
                    className="w-full px-5 py-4 bg-[#0b0c10]/50 border border-[#c5c6c7]/10 rounded-xl text-white placeholder:text-[#c5c6c7]/30 focus:outline-none focus:ring-0 focus:border-[#00ff88]/50 focus:bg-[#0b0c10]/80 transition-all font-medium resize-none leading-relaxed"
                  />
                </div>
              </div>
            </motion.div>

            {/* Contacts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#1f2833]/60 backdrop-blur-xl rounded-2xl border border-[#c5c6c7]/10 p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.3)] relative overflow-hidden"
            >
              <h2 className="text-xl font-black text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                <svg className="w-5 h-5 text-[#ff6b00]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 002 2h2v4l.586-.586z" /></svg>
                Коммуникация
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#c5c6c7]/70 mb-2 ml-1">
                    Ответственный
                  </label>
                  <input
                    type="text"
                    name="contact_name"
                    value={formData.contact_name}
                    onChange={handleChange}
                    placeholder="Имя Фамилия"
                    className="w-full px-5 py-3.5 bg-[#0b0c10]/50 border border-[#c5c6c7]/10 rounded-xl text-white placeholder:text-[#c5c6c7]/30 focus:outline-none focus:ring-0 focus:border-[#ff6b00]/50 focus:bg-[#0b0c10]/80 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#c5c6c7]/70 mb-2 ml-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleChange}
                    placeholder="hr@tech.corp"
                    className="w-full px-5 py-3.5 bg-[#0b0c10]/50 border border-[#c5c6c7]/10 rounded-xl text-white placeholder:text-[#c5c6c7]/30 focus:outline-none focus:ring-0 focus:border-[#00f0ff]/50 focus:bg-[#0b0c10]/80 transition-all font-medium font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#c5c6c7]/70 mb-2 ml-1">
                    Связь (Mobile/TG)
                  </label>
                  <input
                    type="tel"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleChange}
                    placeholder="+X (XXX) XXX-XX-XX"
                    className="w-full px-5 py-3.5 bg-[#0b0c10]/50 border border-[#c5c6c7]/10 rounded-xl text-white placeholder:text-[#c5c6c7]/30 focus:outline-none focus:ring-0 focus:border-[#00ff88]/50 focus:bg-[#0b0c10]/80 transition-all font-medium font-mono"
                  />
                </div>
              </div>
            </motion.div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 sm:p-5 text-red-400 text-sm flex items-center justify-center gap-3 font-medium shadow-[0_0_20px_rgba(239,68,68,0.15)]"
              >
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                {error}
              </motion.div>
            )}

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex flex-col sm:flex-row gap-4 pt-6"
            >
              <button
                type="submit"
                disabled={submitting}
                className="relative flex-1 group overflow-hidden rounded-xl bg-[#1f2833] border border-[#c5c6c7]/20 p-[1px] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-[#c5c6c7]/10"
              >
                <div className="relative h-full w-full py-4 text-center text-[#c5c6c7] group-hover:text-white text-xs sm:text-sm font-black uppercase tracking-widest transition-colors shadow-inner">
                  {submitting ? "Синхронизация..." : "Применить изменения"}
                </div>
              </button>

              {vacancyStatus === "draft" && (
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={submitting}
                  className="relative flex-1 group overflow-hidden rounded-xl bg-gradient-to-r from-[#00ff88] to-[#00cc6a] p-[1px] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.01] active:scale-[0.99] shadow-[0_0_20px_rgba(0,255,136,0.3)] hover:shadow-[0_0_30px_rgba(0,255,136,0.5)]"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-[0%] transition-transform duration-300 ease-out" />
                  <div className="relative h-full w-full bg-[#0b0c10] bg-opacity-10 px-6 py-4 rounded-xl flex items-center justify-center font-black uppercase tracking-widest text-[#0b0c10] text-xs sm:text-sm">
                    {submitting ? "Обработка запроса..." : "Утвердить и опубликовать"}
                  </div>
                </button>
              )}

              <button
                type="button"
                onClick={() => router.push("/vacancies/my")}
                className="flex-shrink-0 px-8 py-4 bg-transparent border border-red-500/30 text-red-500 text-xs sm:text-sm font-black uppercase tracking-widest rounded-xl hover:bg-red-500/10 transition-all shadow-[0_0_10px_rgba(239,68,68,0)] hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
              >
                Отмена
              </button>
            </motion.div>
          </form>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { motion } from "framer-motion";
import ChatCard from "./hero/ChatCard";
import VacancyCard from "./hero/VacancyCard";
import ResumeCard from "./hero/ResumeCard";
import EmployerStatsCard from "./hero/EmployerStatsCard";

type HeroMode = "jobseeker" | "employer";

interface HeroProps {
  defaultMode?: HeroMode;
  hideToggle?: boolean;
  onModeChange?: (mode: HeroMode) => void;
  isAdmin?: boolean;
}

const vacancies = [
  {
    title: "Менеджер по продажам",
    salary: "от 90 000 ₽",
    location: "Офис, Москва",
    schedule: "График: 5/2",
  },
  {
    title: "Маркетолог",
    salary: "80 000 - 100 000 ₽",
    location: "Удалённо",
    experience: "Опыт: 2+ года",
  },
  {
    title: "Аналитик данных",
    salary: "120 000 - 150 000 ₽",
    location: "Гибрид, Москва",
    experience: "Опыт: 3+ года",
  },
];

const resumes = [
  {
    name: "Анна Иванова",
    position: "Frontend Developer",
    experience: "3 года",
    skills: "React, TypeScript",
    salary: "от 150 000 ₽",
  },
  {
    name: "Дмитрий Петров",
    position: "Backend Developer",
    experience: "5 лет",
    skills: "Python, FastAPI",
    salary: "от 180 000 ₽",
  },
  {
    name: "Мария Сидорова",
    position: "UI/UX Designer",
    experience: "2 года",
    skills: "Figma, Adobe XD",
    salary: "от 120 000 ₽",
  },
];

export default function Hero({ defaultMode = "jobseeker", hideToggle = false, onModeChange, isAdmin = false }: HeroProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<HeroMode>(defaultMode);

  const handleModeChange = (newMode: HeroMode) => {
    // Блокировать переключение на employer для не-админов
    if (newMode === "employer" && !isAdmin) {
      return;
    }
    setMode(newMode);
    onModeChange?.(newMode);
  };

  const content = {
    jobseeker: {
      title: (
        <>
          Получи{" "}
          <span className="relative inline-block">
            <span className="relative z-10 italic text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">
              10 подходящих вакансий
            </span>
            <svg
              className="absolute -bottom-2 left-0 w-full h-3 text-orange-400"
              viewBox="0 0 200 12"
              fill="none"
              preserveAspectRatio="none"
            >
              <path
                d="M0,6 Q25,0 50,6 T100,6 T150,6 T200,6"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </span>{" "}
          за 5 минут
        </>
      ),
      subtitle: "ИИ анализирует hh.ru, Avito, SuperJob и подбирает только релевантные предложения. Без часов скролла и дубликатов.",
      cta: user ? "Перейти к поиску" : "Попробовать бесплатно",
      microCopy: "7 дней Pro бесплатно. Без карты.",
      ctaLink: user ? "/chat" : "/auth",
      ctaColor: "from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-500/25 hover:shadow-orange-500/30",
      bgGradient: "from-orange-50/50 via-white to-white",
      decorBlurs: (
        <>
          <div className="absolute top-20 -left-32 w-96 h-96 bg-orange-200/40 rounded-full blur-3xl" />
          <div className="absolute top-40 -right-32 w-96 h-96 bg-orange-100/30 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-1/4 w-64 h-64 bg-blue-100/20 rounded-full blur-3xl" />
        </>
      ),
    },
    employer: {
      title: (
        <>
          Мы находим{" "}
          <span className="relative inline-block">
            <span className="relative z-10 italic text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-blue-600">
              лучших кандидатов
            </span>
            <svg
              className="absolute -bottom-2 left-0 w-full h-3 text-blue-400"
              viewBox="0 0 200 12"
              fill="none"
              preserveAspectRatio="none"
            >
              <path
                d="M0,6 Q25,0 50,6 T100,6 T150,6 T200,6"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </span>
        </>
      ),
      subtitle: "AI-фильтрация резюме и встроенный чат с соискателями.",
      cta: user ? "Разместить вакансию" : "Начать подбор",
      microCopy: "Бесплатный тариф навсегда",
      ctaLink: user ? "/vacancies/create" : "/auth",
      ctaColor: "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/25 hover:shadow-blue-500/30",
      bgGradient: "from-blue-50/50 via-white to-white",
      decorBlurs: (
        <>
          <div className="absolute top-20 -left-32 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl" />
          <div className="absolute top-40 -right-32 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-1/4 w-64 h-64 bg-orange-100/20 rounded-full blur-3xl" />
        </>
      ),
    },
  };

  const currentContent = content[mode];

  return (
    <section className="min-h-screen flex items-center justify-center pt-20 px-6 relative overflow-hidden">
      {/* Background - extends to other sections */}
      <div className={`absolute inset-0 bg-gradient-to-b ${currentContent.bgGradient} pointer-events-none transition-colors duration-500`} />

      {/* Decorative blurs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {currentContent.decorBlurs}
      </div>

      {/* Wave decoration */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg
          className="w-full text-white"
          viewBox="0 0 1440 120"
          fill="currentColor"
          preserveAspectRatio="none"
        >
          <path d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,90 1440,80 L1440,120 L0,120 Z" opacity="0.5" />
          <path d="M0,80 C360,40 720,100 1080,60 C1260,40 1380,60 1440,80 L1440,120 L0,120 Z" />
        </svg>
      </div>

      {/* Left cards */}
      <div
        className="hidden lg:block absolute left-8 xl:left-20 top-1/2 -translate-y-1/2"
        style={{ perspective: "1000px" }}
      >
        <div style={{ transform: mode === "jobseeker" ? "rotateY(12deg) rotateX(2deg)" : "rotateY(-12deg) rotateX(2deg)" }}>
          {mode === "jobseeker" ? <ChatCard /> : <EmployerStatsCard />}
        </div>
      </div>

      {/* Right cards */}
      <div
        className="hidden lg:block absolute right-8 xl:right-20 top-1/2 -translate-y-1/2"
        style={{ perspective: "1000px" }}
      >
        <div
          className="space-y-3"
          style={{ transform: mode === "jobseeker" ? "rotateY(-12deg) rotateX(2deg)" : "rotateY(12deg) rotateX(2deg)" }}
        >
          {mode === "jobseeker"
            ? vacancies.map((vacancy, i) => <VacancyCard key={i} vacancy={vacancy} index={i} />)
            : resumes.map((resume, i) => <ResumeCard key={i} resume={resume} index={i} />)}
        </div>
      </div>

      {/* Center content */}
      <div className="max-w-2xl mx-auto text-center relative z-10">
        {/* Toggle */}
        {!hideToggle && (
          <div className="mb-8 inline-flex p-1.5 rounded-full soft-button-base shadow-[0_8px_24px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] border border-white/40">
            <motion.button
              onClick={() => handleModeChange("jobseeker")}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className={`relative px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                mode === "jobseeker"
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {mode === "jobseeker" && (
                <motion.span
                  className="absolute inset-0 rounded-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    boxShadow: "0 0 20px rgba(249, 115, 22, 0.3), inset 0 1px 0 rgba(255,255,255,0.3)"
                  }}
                />
              )}
              <span className="relative z-10">Ищу работу</span>
            </motion.button>
            <motion.button
              onClick={() => handleModeChange("employer")}
              disabled={!isAdmin}
              whileHover={isAdmin ? { scale: 1.02, y: -1 } : {}}
              whileTap={isAdmin ? { scale: 0.97 } : {}}
              className={`relative px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                mode === "employer"
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                  : isAdmin
                  ? "text-gray-600 hover:text-gray-900"
                  : "text-gray-400 cursor-not-allowed"
              }`}
              title={!isAdmin ? "Функционал работодателей скоро будет доступен" : ""}
            >
              {mode === "employer" && (
                <motion.span
                  className="absolute inset-0 rounded-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    boxShadow: "0 0 20px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255,255,255,0.3)"
                  }}
                />
              )}
              <span className="relative z-10">Ищу сотрудников</span>
              {!isAdmin && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded shadow-lg">
                  Скоро
                </span>
              )}
            </motion.button>
          </div>
        )}

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
          {currentContent.title}
        </h1>
        <p className="text-lg md:text-xl text-muted max-w-xl mx-auto mb-8">
          {currentContent.subtitle}
        </p>

        {/* CTA с микрокопирайтингом */}
        <div className="flex flex-col items-center gap-3">
          <motion.a
            href={currentContent.ctaLink}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative inline-flex items-center gap-2 px-8 py-4 rounded-full text-lg font-medium
              bg-gradient-to-r ${currentContent.ctaColor}
              transition-all duration-300
            `}
            style={{
              boxShadow: mode === "jobseeker"
                ? "0 18px 40px rgba(249,115,22,0.25), 0 8px 18px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -4px 12px rgba(249,115,22,0.15)"
                : "0 18px 40px rgba(59,130,246,0.25), 0 8px 18px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -4px 12px rgba(59,130,246,0.15)"
            }}
          >
            {/* Gradient Border Effect */}
            <span
              className="absolute inset-0 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300"
              style={{
                background: mode === "jobseeker"
                  ? "linear-gradient(90deg, rgba(249,115,22,0.4), rgba(255,255,255,0.6), rgba(249,115,22,0.4))"
                  : "linear-gradient(90deg, rgba(59,130,246,0.4), rgba(255,255,255,0.6), rgba(59,130,246,0.4))",
                padding: "1px",
                WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
              }}
            />
            {/* Ambient Glow */}
            <span
              className="absolute inset-0 rounded-full blur-xl opacity-50 -z-10"
              style={{
                background: mode === "jobseeker"
                  ? "radial-gradient(circle at 30% 50%, rgba(249,115,22,0.4), transparent 60%)"
                  : "radial-gradient(circle at 30% 50%, rgba(59,130,246,0.4), transparent 60%)",
              }}
            />
            <span className="relative z-10">{currentContent.cta}</span>
            <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.a>

          {/* Микрокопирайтинг снижения риска */}
          <p className="text-sm text-muted flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {currentContent.microCopy}
          </p>
        </div>
      </div>
    </section>
  );
}

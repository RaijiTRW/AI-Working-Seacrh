"use client";

import { useState } from "react";
import { useAuth } from "@/lib/useAuth";
import ChatCard from "./hero/ChatCard";
import VacancyCard from "./hero/VacancyCard";
import ResumeCard from "./hero/ResumeCard";
import EmployerStatsCard from "./hero/EmployerStatsCard";
import { motion, AnimatePresence } from "framer-motion";

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
            <span className="relative z-10 italic text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] drop-shadow-[0_0_10px_rgba(255,107,0,0.5)]">
              10 подходящих вакансий
            </span>
            <svg
              className="absolute -bottom-2 left-0 w-full h-3 text-[#ff6b00]"
              viewBox="0 0 200 12"
              fill="none"
              preserveAspectRatio="none"
            >
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
                d="M0,6 Q25,0 50,6 T100,6 T150,6 T200,6"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
                className="drop-shadow-[0_0_8px_rgba(255,107,0,0.8)]"
              />
            </svg>
          </span>{" "}
          <br className="max-md:hidden" />за 5 минут
        </>
      ),
      subtitle: "ИИ анализирует hh.ru, Avito, SuperJob и подбирает только релевантные предложения. Без часов скролла и дубликатов.",
      cta: user ? "Перейти к поиску" : "Попробовать бесплатно",
      microCopy: "3 дня Pro бесплатно. Без карты.",
      ctaLink: user ? "/chat" : "/auth",
      ctaColor: "from-[#ff6b00] to-[#ff8c00] hover:from-[#ff8c00] hover:to-[#ffa633] shadow-[0_0_20px_rgba(255,107,0,0.4)] hover:shadow-[0_0_30px_rgba(255,107,0,0.7)] text-white border border-[#ff6b00]/50",
      bgGradient: "from-[#0b0c10] via-[#1f2833]/30 to-[#0b0c10]",
      decorBlurs: (
        <>
          <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5] }} transition={{ duration: 8, repeat: Infinity }} className="absolute top-20 -left-32 w-96 h-96 bg-[#ff6b00]/20 rounded-full blur-[120px]" />
          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 10, repeat: Infinity, delay: 2 }} className="absolute top-40 -right-32 w-96 h-96 bg-[#ff8c00]/15 rounded-full blur-[100px]" />
          <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 9, repeat: Infinity, delay: 1 }} className="absolute bottom-20 left-1/4 w-64 h-64 bg-[#00f0ff]/10 rounded-full blur-[100px]" />
        </>
      ),
    },
    employer: {
      title: (
        <>
          Мы находим{" "}
          <span className="relative inline-block">
            <span className="relative z-10 italic text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#00c0cc] drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">
              лучших кандидатов
            </span>
            <svg
              className="absolute -bottom-2 left-0 w-full h-3 text-[#00f0ff]"
              viewBox="0 0 200 12"
              fill="none"
              preserveAspectRatio="none"
            >
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
                d="M0,6 Q25,0 50,6 T100,6 T150,6 T200,6"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
                className="drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]"
              />
            </svg>
          </span>
        </>
      ),
      subtitle: "AI-фильтрация резюме и встроенный чат с соискателями.",
      cta: user ? "Разместить вакансию" : "Начать подбор",
      microCopy: "Бесплатный тариф навсегда",
      ctaLink: user ? "/vacancies/create" : "/auth",
      ctaColor: "from-[#00f0ff] to-[#00c0cc] hover:from-[#00c0cc] hover:to-[#0099a6] shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-[0_0_30px_rgba(0,240,255,0.7)] text-[#0b0c10] border border-[#00f0ff]/50",
      bgGradient: "from-[#0b0c10] via-[#00f0ff]/10 to-[#0b0c10]",
      decorBlurs: (
        <>
          <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5] }} transition={{ duration: 8, repeat: Infinity }} className="absolute top-20 -left-32 w-96 h-96 bg-[#00f0ff]/20 rounded-full blur-[120px]" />
          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 10, repeat: Infinity, delay: 2 }} className="absolute top-40 -right-32 w-96 h-96 bg-[#00c0cc]/15 rounded-full blur-[100px]" />
          <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 9, repeat: Infinity, delay: 1 }} className="absolute bottom-20 left-1/4 w-64 h-64 bg-[#ff6b00]/10 rounded-full blur-[100px]" />
        </>
      ),
    },
  };

  const currentContent = content[mode];

  return (
    <section className="min-h-screen flex items-center justify-center pt-20 px-6 relative overflow-hidden bg-[#0b0c10]">
      {/* Background - extends to other sections */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode + "bg"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className={`absolute inset-0 bg-gradient-to-b ${currentContent.bgGradient} pointer-events-none`}
        />
      </AnimatePresence>

      {/* Decorative blurs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {currentContent.decorBlurs}
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5 pointer-events-none" />

      {/* Wave decoration - updated to match dark theme */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg
          className="w-full text-[#0b0c10]"
          viewBox="0 0 1440 120"
          fill="currentColor"
          preserveAspectRatio="none"
        >
          <path d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,90 1440,80 L1440,120 L0,120 Z" opacity="0.3" />
          <path d="M0,80 C360,40 720,100 1080,60 C1260,40 1380,60 1440,80 L1440,120 L0,120 Z" />
        </svg>
      </div>

      {/* Left cards */}
      <div
        className="hidden lg:block absolute left-8 xl:left-20 top-1/2 -translate-y-1/2 z-10"
        style={{ perspective: "1000px" }}
      >
        <motion.div
          animate={{
            rotateY: mode === "jobseeker" ? 12 : -12,
            rotateX: 2,
            y: [-10, 10, -10]
          }}
          transition={{
            y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
            rotateY: { duration: 0.5 },
            rotateX: { duration: 0.5 }
          }}
        >
          {mode === "jobseeker" ? <ChatCard /> : <EmployerStatsCard />}
        </motion.div>
      </div>

      {/* Right cards */}
      <div
        className="hidden lg:block absolute right-8 xl:right-20 top-1/2 -translate-y-1/2 z-10"
        style={{ perspective: "1000px" }}
      >
        <motion.div
          animate={{
            rotateY: mode === "jobseeker" ? -12 : 12,
            rotateX: 2,
            y: [10, -10, 10]
          }}
          transition={{
            y: { duration: 7, repeat: Infinity, ease: "easeInOut" },
            rotateY: { duration: 0.5 },
            rotateX: { duration: 0.5 }
          }}
          className="space-y-4"
        >
          {mode === "jobseeker"
            ? vacancies.map((vacancy, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.2 }}>
                <VacancyCard vacancy={vacancy} index={i} />
              </motion.div>
            ))
            : resumes.map((resume, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.2 }}>
                <ResumeCard resume={resume} index={i} />
              </motion.div>
            ))}
        </motion.div>
      </div>

      {/* Center content */}
      <div className="max-w-3xl mx-auto text-center relative z-20">
        {/* Toggle */}
        {!hideToggle && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 inline-flex p-1 bg-[#1f2833]/80 backdrop-blur-md rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-[#c5c6c7]/10"
          >
            <button
              onClick={() => handleModeChange("jobseeker")}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${mode === "jobseeker"
                  ? "bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] text-white shadow-[0_0_15px_rgba(255,107,0,0.4)]"
                  : "text-[#c5c6c7] hover:text-white"
                }`}
            >
              Ищу работу
            </button>
            <button
              onClick={() => handleModeChange("employer")}
              disabled={!isAdmin}
              className={`relative px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${mode === "employer"
                  ? "bg-gradient-to-r from-[#00f0ff] to-[#00c0cc] text-[#0b0c10] shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                  : isAdmin
                    ? "text-[#c5c6c7] hover:text-white"
                    : "text-[#c5c6c7]/40 cursor-not-allowed"
                }`}
              title={!isAdmin ? "Функционал работодателей скоро будет доступен" : ""}
            >
              Ищу сотрудников
              {!isAdmin && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-[#1f2833] border border-[#ff6b00]/30 text-[#ff6b00] text-[10px] font-bold rounded-sm shadow-[0_0_10px_rgba(255,107,0,0.2)]">
                  Скоро
                </span>
              )}
            </button>
          </motion.div>
        )}

        <motion.h1
          key={mode + "title"}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-white leading-tight mb-6 tracking-tight"
        >
          {currentContent.title}
        </motion.h1>

        <motion.p
          key={mode + "subtitle"}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-[#c5c6c7] max-w-2xl mx-auto mb-10 leading-relaxed font-light"
        >
          {currentContent.subtitle}
        </motion.p>

        {/* CTA с микрокопирайтингом */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href={currentContent.ctaLink}
            className={`inline-flex items-center gap-3 px-8 md:px-10 py-4 md:py-5 bg-gradient-to-r rounded-full text-lg md:text-xl font-bold transition-all ${currentContent.ctaColor}`}
          >
            {currentContent.cta}
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </motion.a>

          {/* Микрокопирайтинг снижения риска */}
          <p className="text-sm text-[#c5c6c7]/70 font-medium flex items-center gap-2">
            <svg className="w-4 h-4 text-[#00f0ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {currentContent.microCopy}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

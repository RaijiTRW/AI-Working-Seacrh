"use client";

import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import { motion } from "framer-motion";

interface FooterProps {
  mode?: "jobseeker" | "employer";
}

export default function Footer({ mode = "jobseeker" }: FooterProps) {
  const { user } = useAuth();

  const content = {
    jobseeker: {
      title: "Хватит тратить время на поиск работы",
      subtitle: "Зарегистрируйся за 30 секунд и получи первые вакансии через 5 минут. Бесплатно.",
      cta: user ? "Перейти к поиску" : "Начать бесплатно",
      microCopy: "3 дня Pro • Без карты • Отменить можно всегда",
      ctaLink: user ? "/chat" : "/auth",
    },
    employer: {
      title: "Готовы найти лучших кандидатов?",
      subtitle: "Начните бесплатно — разместите первую вакансию и получите отклики.",
      cta: user ? "Разместить вакансию" : "Начать подбор",
      microCopy: "Бесплатный тариф навсегда",
      ctaLink: user ? "/vacancies/create" : "/auth",
    },
  };

  const currentContent = content[mode];

  return (
    <footer
      id="cta"
      className="py-16 md:py-24 px-4 sm:px-6"
      style={{
        background: "linear-gradient(180deg, #f8f8f8, #ffffff)"
      }}
    >
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 md:mb-6">
          {currentContent.title}
        </h2>
        <p className="text-base md:text-lg text-muted mb-8 md:mb-10">
          {currentContent.subtitle}
        </p>

        {/* CTA с микрокопирайтингом - Neumorphic raised button */}
        <div className="flex flex-col items-center gap-3 mb-12 md:mb-16">
          <motion.a
            href={currentContent.ctaLink}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 rounded-full text-base md:text-lg font-medium text-white relative overflow-hidden"
            style={{
              background: mode === "jobseeker"
                ? "linear-gradient(135deg, #f97316, #ea580c)"
                : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
              boxShadow: mode === "jobseeker"
                ? "8px 8px 20px rgba(200,80,0,0.25), -4px -4px 14px rgba(255,200,150,0.3), inset 0 2px 4px rgba(255,255,255,0.2)"
                : "8px 8px 20px rgba(30,80,200,0.25), -4px -4px 14px rgba(100,180,255,0.3), inset 0 2px 4px rgba(255,255,255,0.2)"
            }}
          >
            {/* Top highlight */}
            <div
              className="absolute top-0 left-6 right-6 h-4 rounded-b-full blur-sm pointer-events-none"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.3), transparent)",
              }}
            />
            <span className="relative z-10">{currentContent.cta}</span>
            <svg className="w-4 h-4 md:w-5 md:h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.a>

          {/* Микрокопирайтинг */}
          <p className="text-sm text-muted">
            {currentContent.microCopy}
          </p>
        </div>

        <div
          className="border-t pt-6 md:pt-8 text-xs md:text-sm text-muted"
          style={{
            borderColor: "rgba(200,200,200,0.3)"
          }}
        >
          <p>Контакты: help@jobaisearch.ru</p>
          <p className="mt-2">
            <Link href="/privacy" className="hover:text-gray-700 transition-colors">
              Конфиденциальность
            </Link>
            {" • "}
            2026 Job Search. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
}

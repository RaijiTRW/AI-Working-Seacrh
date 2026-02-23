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
      ctaColor: "from-[#ff6b00] to-[#ff8c00] hover:from-[#ff8c00] hover:to-[#ffa633] text-white shadow-[0_0_15px_rgba(255,107,0,0.3)] hover:shadow-[0_0_25px_rgba(255,107,0,0.6)]",
    },
    employer: {
      title: "Готовы найти лучших кандидатов?",
      subtitle: "Начните бесплатно — разместите первую вакансию и получите отклики.",
      cta: user ? "Разместить вакансию" : "Начать подбор",
      microCopy: "Бесплатный тариф навсегда",
      ctaLink: user ? "/vacancies/create" : "/auth",
      ctaColor: "from-[#00f0ff] to-[#00c0cc] hover:from-[#00c0cc] hover:to-[#0099a6] text-[#0b0c10] shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)]",
    },
  };

  const currentContent = content[mode];

  return (
    <footer id="cta" className="py-16 md:py-24 px-4 sm:px-6 bg-[#0b0c10] relative overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] via-[#1f2833]/20 to-transparent pointer-events-none" />

      {/* Glowing orbs */}
      <div className="absolute -left-40 bottom-0 w-80 h-80 bg-[#ff6b00]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -right-40 top-0 w-80 h-80 bg-[#00f0ff]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-3xl mx-auto text-center relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6 leading-tight text-white"
        >
          {currentContent.title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-base md:text-lg text-[#c5c6c7] mb-8 md:mb-10 max-w-2xl mx-auto"
        >
          {currentContent.subtitle}
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col items-center gap-3 mb-12 md:mb-16"
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

          {/* Microcopy */}
          <p className="text-sm text-[#c5c6c7]/70 font-medium">
            {currentContent.microCopy}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="border-t border-[#1f2833] pt-6 md:pt-8 text-xs md:text-sm text-[#c5c6c7]/60 flex flex-col items-center gap-2"
        >
          <p>Контакты: help@jobaisearch.ru</p>
          <p className="flex items-center gap-3 mt-1">
            <Link href="/privacy" className="hover:text-[#00f0ff] transition-colors">
              Конфиденциальность
            </Link>
            <span className="w-1 h-1 rounded-full bg-[#1f2833]" />
            <span>2026 JobAISearch. Все права защищены.</span>
          </p>
        </motion.div>
      </div>
    </footer>
  );
}

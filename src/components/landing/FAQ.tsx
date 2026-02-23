"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    question: "А если ИИ найдёт не то, что мне нужно?",
    answer:
      "ИИ учится на твоих действиях. После первого поиска точность составляет ~85%, после 2-3 уточнений — 94%+. У тебя есть 3 дня бесплатного Pro-доступа, чтобы убедиться в качестве подбора.",
  },
  {
    question: "Чем это лучше, чем ручной поиск на hh?",
    answer:
      "Мы параллельно сканируем 5+ крупнейших агрегаторов: hh.ru, Avito, SuperJob, Хабр Карьера. Ты получаешь поток со всех источников без дубликатов. Пользователи экономят до 3 часов в день.",
  },
  {
    question: "Почему подписка стоит своих денег?",
    answer:
      "Цена подписки окупается за первый же день сэкономленного времени (при оценке твоего часа в 500+ ₽). ИИ избавляет от рутины, выгорания и пропущенных возможностей.",
  },
  {
    question: "Как быстро я получу первые вакансии?",
    answer:
      "Через 2-5 минут после регистрации. Ты рассказываешь нашему AI-боту о себе, он сразу сканирует базы и выдает первую подборку. Дальше — автообновление каждые 2-4 часа.",
  },
  {
    question: "Что если после 3-дневного триала я не захочу платить?",
    answer:
      "Ничего не спишется. Мы не требуем привязки карты для активации триала. Ты просто перейдёшь на бесплатный план Base с ограничением на количество AI-запросов в день.",
  },
  {
    question: "Откуда берутся вакансии? Это парсинг или фейки?",
    answer:
      "Мы используем официальные API площадок и умные парсеры с защитой от фейков. Наша нейросеть анализирует текст вакансии и удаляет подозрительные или неактуальные предложения.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 md:py-32 px-4 sm:px-6 bg-[#0b0c10] relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:radial-gradient(ellipse_at_bottom,white,transparent_80%)] opacity-5 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#1f2833] to-transparent" />

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-6">
            Люди спрашивают
          </h2>
          <p className="text-lg text-[#c5c6c7] max-w-xl mx-auto font-light">
            Прозрачные ответы на самые частые вопросы перед стартом.
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`bg-[#1f2833]/40 backdrop-blur-sm rounded-2xl overflow-hidden border transition-colors duration-300 ${isOpen ? "border-[#ff6b00]/50 shadow-[0_0_20px_rgba(255,107,0,0.1)]" : "border-[#c5c6c7]/10 hover:border-[#c5c6c7]/30"
                  }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4"
                >
                  <span className={`font-bold text-base md:text-lg transition-colors ${isOpen ? "text-[#ff6b00]" : "text-white"}`}>
                    {faq.question}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isOpen
                        ? "bg-[#ff6b00] text-white shadow-[0_0_10px_rgba(255,107,0,0.5)]"
                        : "bg-[#0b0c10] text-[#c5c6c7]"
                      }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </motion.span>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-6 text-base text-[#c5c6c7]/80 leading-relaxed font-light border-t border-[#c5c6c7]/10 pt-4 mt-2">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

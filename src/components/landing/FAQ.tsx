"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    question: "А если ИИ найдёт не то, что мне нужно?",
    answer:
      "ИИ учится на твоих предпочтениях. После первого поиска точность ~85%, после 2-3 уточнений — 94%+. Плюс у тебя 3 дня Pro Trial бесплатно, чтобы убедиться, что подходит.",
  },
  {
    question: "Чем это лучше, чем самому искать на hh.ru?",
    answer:
      "Мы сканируем 5+ площадок одновременно: hh.ru, Avito, SuperJob, Работа.ру. Ты получаешь вакансии из всех источников без дубликатов. В среднем пользователи экономят 3+ часа в день.",
  },
  {
    question: "499 ₽/месяц — дорого. Почему столько?",
    answer:
      "Это меньше 17 ₽ в день. За эти деньги ИИ экономит тебе 3+ часа ежедневно. Если твой час стоит хотя бы 500 ₽, сервис окупается за первый день. Плюс первые 3 дня бесплатно.",
  },
  {
    question: "Как быстро я получу первые вакансии?",
    answer:
      "Через 2-5 минут после регистрации. Заполняешь профиль в чате с ИИ, и сразу получаешь подборку. Дальше вакансии обновляются автоматически каждые 2 часа.",
  },
  {
    question: "Что если через 3 дня Trial я не хочу платить?",
    answer:
      "Ничего не случится. Ты автоматически перейдёшь на бесплатный Base план с 3 запросами в день. Карту мы не привязываем, скрытых списаний нет.",
  },
  {
    question: "Откуда берутся вакансии? Они настоящие?",
    answer:
      "Мы парсим официальные API hh.ru, Avito и других площадок. Все вакансии реальные и актуальные. Обновление каждые 2 часа, неактуальные удаляем автоматически.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      className="py-16 md:py-24 px-4 sm:px-6"
      style={{
        background: "linear-gradient(180deg, #ffffff, #f5f5f5)"
      }}
    >
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4">
          Остались вопросы?
        </h2>
        <p className="text-center text-muted mb-10 md:mb-16 max-w-xl mx-auto">
          Вот что чаще всего спрашивают перед регистрацией
        </p>
        <div className="space-y-2 md:space-y-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="rounded-2xl overflow-hidden relative"
              style={{
                background: "linear-gradient(145deg, #ffffff, #f0f0f0)",
                boxShadow: "8px 8px 20px rgba(160,160,160,0.2), -8px -8px 20px rgba(255,255,255,0.8), inset 0 1px 2px rgba(255,255,255,0.6)"
              }}
            >
              {/* Top highlight */}
              <div
                className="absolute top-0 left-4 right-4 h-4 rounded-b-full blur-sm pointer-events-none"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.4), transparent)",
                }}
              />

              <motion.button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                whileHover={{ y: openIndex === index ? 0 : -1 }}
                className="w-full px-4 md:px-6 py-4 md:py-5 text-left flex items-center justify-between gap-3 relative z-10"
                style={{
                  background: openIndex === index
                    ? "linear-gradient(145deg, #fff7ed, #ffedd5)"
                    : "transparent"
                }}
              >
                <span className="font-medium text-sm md:text-base">{faq.question}</span>
                <span
                  className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                    openIndex === index
                      ? "text-white"
                      : "text-gray-500"
                  }`}
                  style={{
                    background: openIndex === index
                      ? "linear-gradient(135deg, #f97316, #ea580c)"
                      : "linear-gradient(145deg, #fafafa, #e5e5e5)",
                    boxShadow: openIndex === index
                      ? "0 2px 6px rgba(200,80,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)"
                      : "4px 4px 10px rgba(150,150,150,0.1), -3px -3px 8px rgba(255,255,255,0.7), inset 0 1px 2px rgba(255,255,255,0.4)",
                    transform: openIndex === index ? "rotate(45deg)" : "rotate(0deg)"
                  }}
                >
                  <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </span>
              </motion.button>

              <AnimatePresence initial={false}>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 md:px-6 pb-4 md:pb-5 text-sm md:text-base text-muted">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

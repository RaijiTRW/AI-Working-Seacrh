"use client";

import { motion } from "framer-motion";

const steps = [
  {
    number: "1",
    title: "Опиши, что ищешь",
    description: "2 минуты в чате с ИИ. Город, зарплата, формат работы — мы запомним.",
    result: "Твой профиль поиска готов",
  },
  {
    number: "2",
    title: "Мы сканируем 5+ площадок",
    description: "hh.ru, Avito, SuperJob, Работа.ру и другие. Каждые 2 часа обновляем.",
    result: "2000+ вакансий под контролем",
  },
  {
    number: "3",
    title: "Получаешь только релевантное",
    description: "ИИ фильтрует дубликаты, фейки и неподходящие. Остаётся 5-15 лучших.",
    result: "Экономия 3+ часов в день",
  },
];

export default function HowItWorks() {
  return (
    <section
      className="py-16 md:py-24 px-4 sm:px-6"
      style={{
        background: "linear-gradient(180deg, #f5f5f0, #ffffff)"
      }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            Как это работает
          </h2>
          <p className="text-lg text-muted">
            От регистрации до первых вакансий — 5 минут
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="text-center p-5 rounded-2xl relative"
              style={{
                background: "linear-gradient(145deg, #ffffff, #f0f0f0)",
                boxShadow: "12px 12px 24px rgba(160,160,160,0.25), -12px -12px 24px rgba(255,255,255,0.8), inset 0 2px 4px rgba(255,255,255,0.5)",
              }}
            >
              {/* Top highlight */}
              <div
                className="absolute top-0 left-8 right-8 h-8 rounded-b-full blur-sm pointer-events-none"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.5), transparent)",
                }}
              />

              {/* Номер шага - Neumorphic raised */}
              <div
                className="w-14 h-14 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-5 relative"
                style={{
                  background: "linear-gradient(135deg, #f97316, #ea580c)",
                  boxShadow: "6px 6px 14px rgba(200,80,0,0.25), -3px -3px 10px rgba(255,200,150,0.3), inset 0 2px 4px rgba(255,255,255,0.2)"
                }}
              >
                {/* Top highlight */}
                <div
                  className="absolute top-0 left-2 right-2 h-4 rounded-b-full blur-sm pointer-events-none"
                  style={{
                    background: "linear-gradient(180deg, rgba(255,255,255,0.4), transparent)",
                  }}
                />
                {step.number}
              </div>

              {/* Заголовок */}
              <h3 className="text-lg md:text-xl font-semibold mb-2">
                {step.title}
              </h3>

              {/* Описание */}
              <p className="text-sm md:text-base text-muted mb-4">
                {step.description}
              </p>

              {/* Результат шага - Neumorphic inset */}
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-green-700"
                style={{
                  background: "linear-gradient(145deg, #f0fdf4, #dcfce7)",
                  boxShadow: "inset 3px 3px 6px rgba(20,150,50,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)"
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {step.result}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

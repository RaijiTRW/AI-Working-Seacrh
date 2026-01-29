"use client";

import { motion } from "framer-motion";
import type { JSX } from "react";

const benefits = [
  {
    title: "3+ часа в день на себя",
    description: "Пока другие скроллят hh.ru, ты занимаешься важным. Мы ищем за тебя.",
    icon: "clock",
    metric: "В среднем экономят наши пользователи",
  },
  {
    title: "Только стоящие вакансии",
    description: "ИИ отсекает дубликаты, фейки и вакансии с подвохом. Ты видишь только настоящие предложения.",
    icon: "filter",
    metric: "87% вакансий отсеиваем как нерелевантные",
  },
  {
    title: "Все площадки в одной ленте",
    description: "hh, Avito, SuperJob, Работа.ру — не нужно прыгать между сайтами. Всё в одном месте.",
    icon: "grid",
    metric: "5+ площадок под контролем",
  },
  {
    title: "ИИ помнит твои предпочтения",
    description: "Один раз настроил — получаешь релевантное. Без повторных фильтров каждый день.",
    icon: "user",
    metric: "Точность подбора 94%",
  },
];

const icons: Record<string, JSX.Element> = (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const iconComponents: Record<string, JSX.Element> = {
  clock: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  filter: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  ),
  grid: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  user: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
};

export default function Benefits() {
  return (
    <section
      className="py-16 md:py-24 px-4 sm:px-6"
      style={{
        background: "linear-gradient(180deg, #ffffff, #f8f8f8)"
      }}
    >
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-10 md:mb-16">
          Почему мы
        </h2>
        <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="p-5 md:p-6 rounded-2xl relative overflow-hidden"
              style={{
                background: "linear-gradient(145deg, #ffffff, #f0f0f0)",
                boxShadow: "12px 12px 24px rgba(160,160,160,0.25), -12px -12px 24px rgba(255,255,255,0.8), inset 0 2px 4px rgba(255,255,255,0.5)",
              }}
            >
              {/* Top highlight */}
              <div
                className="absolute top-0 left-4 right-4 h-6 rounded-b-full blur-sm pointer-events-none"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.5), transparent)",
                }}
              />

              {/* Icon - Neumorphic raised */}
              <div
                className="w-11 h-11 md:w-12 md:h-12 rounded-xl text-orange-500 flex items-center justify-center mb-4 relative"
                style={{
                  background: "linear-gradient(145deg, #fff7ed, #fed7aa)",
                  boxShadow: "4px 4px 10px rgba(200,100,0,0.12), -3px -3px 8px rgba(255,220,180,0.5), inset 0 1px 2px rgba(255,255,255,0.6)"
                }}
              >
                {iconComponents[benefit.icon]}
              </div>

              <h3 className="text-lg md:text-xl font-semibold mb-2">
                {benefit.title}
              </h3>

              <p className="text-sm md:text-base text-muted mb-3">
                {benefit.description}
              </p>

              {/* Метрика - Neumorphic inset */}
              <div
                className="inline-block px-3 py-1.5 rounded-full text-xs font-medium text-orange-600"
                style={{
                  background: "linear-gradient(145deg, #fff7ed, #ffedd5)",
                  boxShadow: "inset 2px 2px 4px rgba(200,100,0,0.08), inset -2px -2px 4px rgba(255,255,255,0.7)"
                }}
              >
                {benefit.metric}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

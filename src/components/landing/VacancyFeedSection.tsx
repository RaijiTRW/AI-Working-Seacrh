"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const mockVacancies = [
  {
    title: "Frontend разработчик",
    company: "Яндекс",
    salary: "180 000 - 250 000 ₽",
    location: "Москва",
    source: "platform",
    tags: ["React", "TypeScript"],
  },
  {
    title: "Python Developer",
    company: "Сбер",
    salary: "200 000 - 300 000 ₽",
    location: "Удалённо",
    source: "hh",
    tags: ["Python", "FastAPI"],
  },
  {
    title: "DevOps инженер",
    company: "VK",
    salary: "от 220 000 ₽",
    location: "Санкт-Петербург",
    source: "platform",
    tags: ["Docker", "K8s"],
  },
  {
    title: "Data Analyst",
    company: "Тинькофф",
    salary: "150 000 - 200 000 ₽",
    location: "Гибрид",
    source: "superjob",
    tags: ["SQL", "Python"],
  },
];

function MockVacancyCard({ vacancy, index }: { vacancy: typeof mockVacancies[0]; index: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), index * 200);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="p-3 rounded-2xl relative overflow-hidden"
      style={{
        background: "linear-gradient(145deg, #ffffff, #f0f0f0)",
        boxShadow: "12px 12px 24px rgba(160,160,160,0.25), -12px -12px 24px rgba(255,255,255,0.9), inset 0 2px 4px rgba(255,255,255,0.7)"
      }}
    >
      {/* Top highlight */}
      <div
        className="absolute top-0 left-3 right-3 h-4 rounded-b-full blur-sm pointer-events-none"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.6), transparent)",
        }}
      />

      <div className="flex items-start justify-between mb-2 relative z-10">
        <div className="flex-1">
          <h4 className="font-semibold text-sm text-gray-900 mb-0.5">{vacancy.title}</h4>
          <p className="text-xs text-gray-500">{vacancy.company}</p>
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
            vacancy.source === "platform"
              ? "text-orange-600"
              : vacancy.source === "hh"
              ? "text-blue-600"
              : "text-gray-600"
          }`}
          style={{
            background: vacancy.source === "platform"
              ? "linear-gradient(145deg, #fff7ed, #ffedd5)"
              : vacancy.source === "hh"
              ? "linear-gradient(145deg, #eff6ff, #dbeafe)"
              : "linear-gradient(145deg, #fafafa, #e5e5e5)",
            boxShadow: "inset 2px 2px 4px rgba(150,150,150,0.12), inset -2px -2px 4px rgba(255,255,255,0.6)"
          }}
        >
          {vacancy.source === "platform" ? "Наши" : vacancy.source === "hh" ? "hh.ru" : "SJ"}
        </span>
      </div>
      <p className="text-orange-500 font-bold text-sm mb-2">{vacancy.salary}</p>
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {vacancy.location}
        </span>
      </div>
      <div className="flex gap-1">
        {vacancy.tags.map((tag) => (
          <span
            key={tag}
            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{
              background: "linear-gradient(145deg, #fafafa, #e5e5e5)",
              color: "#6b7280",
              boxShadow: "inset 2px 2px 4px rgba(150,150,150,0.12), inset -2px -2px 4px rgba(255,255,255,0.7)"
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

function FeedMockup() {
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFilter((prev) => {
        if (prev === "all") return "platform";
        if (prev === "platform") return "network";
        return "all";
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl overflow-hidden w-full max-w-[320px] sm:w-80 relative"
      style={{
        background: "linear-gradient(145deg, #ffffff, #f0f0f0)",
        boxShadow: "20px 20px 40px rgba(160,160,160,0.25), -20px -20px 40px rgba(255,255,255,0.9), inset 0 2px 4px rgba(255,255,255,0.8)"
      }}
    >
      {/* Top highlight */}
      <div
        className="absolute top-0 left-4 right-4 h-6 rounded-b-full blur-sm pointer-events-none"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.7), transparent)",
        }}
      />

      {/* Header */}
      <div className="px-4 py-3 border-b relative z-10" style={{ borderColor: "rgba(200,200,200,0.3)" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Лента вакансий</h3>
          <div className="flex items-center gap-1">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-green-400"
            />
            <span className="text-xs text-gray-500">Live</span>
          </div>
        </div>

        {/* Stats - Neumorphic inset */}
        <div className="flex gap-2 mb-3">
          <div
            className="flex-1 px-2 py-1.5 text-center rounded-xl"
            style={{
              background: "linear-gradient(145deg, #fff7ed, #fed7aa)",
              boxShadow: "inset 3px 3px 6px rgba(200,100,0,0.12), inset -3px -3px 6px rgba(255,255,255,0.5)"
            }}
          >
            <div className="text-lg font-bold text-orange-600">127</div>
            <div className="text-[10px] text-orange-600/70">Наши</div>
          </div>
          <div
            className="flex-1 px-2 py-1.5 text-center rounded-xl"
            style={{
              background: "linear-gradient(145deg, #fafafa, #e5e5e5)",
              boxShadow: "inset 3px 3px 6px rgba(150,150,150,0.15), inset -3px -3px 6px rgba(255,255,255,0.5)"
            }}
          >
            <div className="text-lg font-bold text-gray-600">2,340</div>
            <div className="text-[10px] text-gray-500">В сети</div>
          </div>
          <div
            className="flex-1 px-2 py-1.5 text-center rounded-xl"
            style={{
              background: "linear-gradient(145deg, #eff6ff, #dbeafe)",
              boxShadow: "inset 3px 3px 6px rgba(30,80,200,0.12), inset -3px -3px 6px rgba(255,255,255,0.5)"
            }}
          >
            <div className="text-lg font-bold text-blue-600">2,467</div>
            <div className="text-[10px] text-blue-600/70">Всего</div>
          </div>
        </div>

        {/* Filters - Neumorphic buttons */}
        <div className="flex gap-1">
          {[
            { id: "all", label: "Все" },
            { id: "platform", label: "Наши" },
            { id: "network", label: "В сети" },
          ].map((filter) => (
            <motion.button
              key={filter.id}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveFilter(filter.id)}
              className={`flex-1 px-2 py-1.5 rounded-xl text-xs font-medium transition-all relative overflow-hidden ${
                activeFilter === filter.id
                  ? "text-white"
                  : "text-gray-600"
              }`}
              style={{
                background: activeFilter === filter.id
                  ? "linear-gradient(135deg, #f97316, #ea580c)"
                  : "linear-gradient(145deg, #fafafa, #e5e5e5)",
                boxShadow: activeFilter === filter.id
                  ? "0 6px 14px rgba(200,80,0,0.3), -3px -3px 8px rgba(255,200,150,0.4), inset 0 1px 0 rgba(255,255,255,0.25)"
                  : "6px 6px 12px rgba(150,150,150,0.12), -6px -6px 12px rgba(255,255,255,0.8), inset 0 1px 2px rgba(255,255,255,0.6)"
              }}
            >
              {filter.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Vacancy list */}
      <div className="p-3 space-y-2 max-h-72 overflow-y-auto relative z-10" style={{ background: "linear-gradient(180deg, #fafafa, #f0f0f0)" }}>
        {mockVacancies.map((vacancy, i) => (
          <MockVacancyCard key={i} vacancy={vacancy} index={i} />
        ))}
      </div>

      {/* Footer - Neumorphic inset */}
      <div
        className="px-4 py-2 text-center border-t relative z-10"
        style={{
          borderColor: "rgba(200,200,200,0.3)"
        }}
      >
        <span className="text-xs text-gray-400">
          Обновляется каждые 2 часа
        </span>
      </div>
    </motion.div>
  );
}

export default function VacancyFeedSection() {
  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(180deg, rgba(255,247,237,0.4), rgba(255,255,255,0))"
        }}
      />

      {/* Decorative blurs with enhanced glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-20 -right-32 w-64 md:w-96 h-64 md:h-96 rounded-full blur-3xl"
          style={{ background: "rgba(249,115,22,0.25)" }}
        />
        <motion.div
          animate={{
            scale: [1, 1.03, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
          className="absolute bottom-20 -left-32 w-48 md:w-64 h-48 md:h-64 rounded-full blur-3xl"
          style={{ background: "rgba(59,130,246,0.2)" }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-12 lg:gap-20">
          {/* Left - Text content */}
          <div className="flex-1 text-center lg:text-left order-2 lg:order-1">
            {/* Badge - Neumorphic raised */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3 py-1 mb-4 md:mb-6 rounded-full relative overflow-hidden"
              style={{
                background: "linear-gradient(145deg, #fff7ed, #ffedd5)",
                boxShadow: "6px 6px 12px rgba(200,100,0,0.18), -6px -6px 12px rgba(255,220,180,0.6), inset 0 2px 4px rgba(255,255,255,0.5)"
              }}
            >
              {/* Top highlight */}
              <div
                className="absolute top-0 left-2 right-2 h-3 rounded-b-full blur-sm pointer-events-none"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.7), transparent)",
                }}
              />
              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <span className="text-sm font-medium text-orange-600 relative z-10">Новая функция</span>
            </motion.div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6">
              Лента вакансий{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">
                в реальном времени
              </span>
            </h2>
            <p className="text-base md:text-lg text-gray-600 mb-6 md:mb-8 max-w-xl mx-auto lg:mx-0">
              Больше не нужно сидеть на hh.ru и SuperJob. Мы собираем вакансии со всех площадок,
              фильтруем и показываем только актуальные предложения.
            </p>

            <div className="space-y-3 md:space-y-4 mb-6 md:mb-8 text-left max-w-md mx-auto lg:mx-0">
              {[
                { icon: "🔄", text: "Автообновление каждые 2 часа" },
                { icon: "🎯", text: "Фильтрация по источнику: наши / из сети" },
                { icon: "✅", text: "Только проверенные актуальные вакансии" },
                { icon: "📊", text: "Статистика по всем площадкам" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-lg md:text-xl">{item.icon}</span>
                  <span className="text-sm md:text-base text-gray-700">{item.text}</span>
                </div>
              ))}
            </div>

            {/* CTA - Neumorphic raised */}
            <motion.a
              href="/vacancies"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-5 md:px-6 py-2.5 md:py-3 rounded-full text-sm md:text-base font-medium text-white relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #f97316, #ea580c)",
                boxShadow: "10px 10px 24px rgba(200,80,0,0.3), -6px -6px 18px rgba(255,200,150,0.4), inset 0 2px 4px rgba(255,255,255,0.25)"
              }}
            >
              {/* Top highlight */}
              <div
                className="absolute top-0 left-4 right-4 h-4 rounded-b-full blur-sm pointer-events-none"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.4), transparent)",
                }}
              />
              <span className="relative z-10">Открыть ленту</span>
              <svg className="w-4 h-4 md:w-5 md:h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.a>
          </div>

          {/* Right - Feed mockup with tilt on desktop */}
          <div className="order-1 lg:order-2 w-full lg:w-auto flex justify-center lg:justify-end perspective-[1000px]">
            <div className="lg:[transform:rotateY(-8deg)_rotateX(2deg)] [transform-style:preserve-3d]">
              <FeedMockup />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.15 }}
      className="bg-[#1f2833]/60 backdrop-blur-md rounded-xl p-4 border border-[#c5c6c7]/10 hover:border-[#ff6b00]/30 transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-bold text-sm text-white mb-0.5">{vacancy.title}</h4>
          <p className="text-xs text-[#c5c6c7]/80">{vacancy.company}</p>
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm ${vacancy.source === "platform"
            ? "bg-[#ff6b00]/20 text-[#ff6b00] border border-[#ff6b00]/30"
            : "bg-[#0b0c10] text-[#c5c6c7]/80 border border-[#c5c6c7]/20"
            }`}
        >
          {vacancy.source === "platform" ? "Наши" : vacancy.source === "hh" ? "hh.ru" : "SJ"}
        </span>
      </div>
      <p className="text-[#00f0ff] font-bold text-sm mb-3 drop-shadow-[0_0_5px_rgba(0,240,255,0.3)]">{vacancy.salary}</p>

      <div className="flex gap-2">
        {vacancy.tags.map((tag) => (
          <span key={tag} className="text-[10px] px-2 py-0.5 bg-[#0b0c10] text-[#c5c6c7] border border-[#c5c6c7]/10 rounded-sm">
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
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#0b0c10] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] border border-[#1f2833] overflow-hidden w-full max-w-[340px] sm:w-80 relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ff6b00] via-[#00f0ff] to-[#a200ff]" />

      {/* Header */}
      <div className="bg-[#1f2833]/40 px-4 py-4 border-b border-[#1f2833] backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white tracking-wide">Лента вакансий</h3>
          <div className="flex items-center gap-1.5 bg-[#0b0c10] px-2 py-0.5 rounded-full border border-[#c5c6c7]/10">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] shadow-[0_0_5px_#00f0ff] animate-pulse" />
            <span className="text-[10px] uppercase font-bold text-[#c5c6c7]">Live</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 bg-[#ff6b00]/10 border border-[#ff6b00]/20 rounded-lg px-2 py-2 text-center">
            <div className="text-lg font-bold text-[#ff6b00] drop-shadow-[0_0_5px_rgba(255,107,0,0.4)]">127</div>
            <div className="text-[10px] text-[#ff6b00]/70 font-semibold uppercase tracking-wider">Наши</div>
          </div>
          <div className="flex-1 bg-[#1f2833]/50 border border-[#c5c6c7]/10 rounded-lg px-2 py-2 text-center">
            <div className="text-lg font-bold text-[#c5c6c7]">2,340</div>
            <div className="text-[10px] text-[#c5c6c7]/70 font-semibold uppercase tracking-wider">В сети</div>
          </div>
          <div className="flex-1 bg-[#00f0ff]/10 border border-[#00f0ff]/20 rounded-lg px-2 py-2 text-center">
            <div className="text-lg font-bold text-[#00f0ff] drop-shadow-[0_0_5px_rgba(0,240,255,0.4)]">2,467</div>
            <div className="text-[10px] text-[#00f0ff]/70 font-semibold uppercase tracking-wider">Всего</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-1 bg-[#0b0c10] p-1 rounded-lg border border-[#c5c6c7]/10 relative">
          {[
            { id: "all", label: "Все" },
            { id: "platform", label: "Наши" },
            { id: "network", label: "В сети" },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`flex-1 px-2 py-1.5 rounded-md text-xs font-bold transition-all relative z-10 ${activeFilter === filter.id
                  ? "text-white"
                  : "text-[#c5c6c7]/60 hover:text-white"
                }`}
            >
              {filter.label}
              {activeFilter === filter.id && (
                <motion.div
                  layoutId="mockupFilter"
                  className="absolute inset-0 bg-[#1f2833] rounded-md -z-10 border border-[#c5c6c7]/10 shadow-sm"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Vacancy list */}
      <div className="p-3 space-y-3 h-80 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFilter}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {mockVacancies.filter(v =>
              activeFilter === "all" ||
              (activeFilter === "platform" && v.source === "platform") ||
              (activeFilter === "network" && v.source !== "platform")
            ).map((vacancy, i) => (
              <MockVacancyCard key={i} vacancy={vacancy} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Bottom fade out gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0b0c10] to-transparent pointer-events-none" />
      </div>

      {/* Footer */}
      <div className="bg-[#1f2833]/40 px-4 py-3 border-t border-[#1f2833] text-center backdrop-blur-md">
        <div className="flex items-center justify-center gap-2">
          <svg className="w-3 h-3 text-[#00f0ff] animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-[10px] text-[#c5c6c7]/60 uppercase tracking-widest font-semibold">Обновлено только что</span>
        </div>
      </div>
    </div>
  );
}

export default function VacancyFeedSection() {
  return (
    <section className="py-20 md:py-32 px-4 sm:px-6 relative overflow-hidden bg-[#0b0c10]">
      {/* Background with Grid */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:radial-gradient(ellipse_at_center,white,transparent_80%)] opacity-10 pointer-events-none" />

      {/* Decorative blurs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -right-32 w-64 md:w-96 h-64 md:h-96 bg-[#ff6b00]/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 -left-32 w-48 md:w-64 h-48 md:h-64 bg-[#00f0ff]/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Left - Text content */}
          <div className="flex-1 text-center lg:text-left order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#ff6b00]/10 border border-[#ff6b00]/30 text-[#ff6b00] rounded-full text-sm font-bold mb-6 shadow-[0_0_15px_rgba(255,107,0,0.2)]"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff6b00] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff6b00]"></span>
              </span>
              Новая функция платформы
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tight"
            >
              Единая лента{" "}
              <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#00c0cc] drop-shadow-[0_0_10px_rgba(0,240,255,0.4)]">
                вакансий
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-[#c5c6c7] mb-8 lg:max-w-md mx-auto lg:mx-0 font-light leading-relaxed"
            >
              Больше не нужно прыгать по сайтам. Мы собираем предложения со всех площадок,
              отсеиваем мусор через нейросеть и показываем только лучшее.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="space-y-4 mb-10 text-left max-w-sm mx-auto lg:mx-0 bg-[#1f2833]/30 p-6 rounded-2xl border border-[#c5c6c7]/10"
            >
              {[
                { icon: "⚡", text: "Автообновление данных 24/7" },
                { icon: "🛡️", text: "Анти-дубликат и анти-фейк фильтры" },
                { icon: "📊", text: "Умная сортировка по релевантности" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-xl bg-[#0b0c10] w-10 h-10 rounded-full flex items-center justify-center border border-[#c5c6c7]/10 shadow-inner">{item.icon}</span>
                  <span className="text-sm md:text-base font-medium text-white">{item.text}</span>
                </div>
              ))}
            </motion.div>

            <motion.a
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="/vacancies"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#00f0ff] to-[#00c0cc] text-[#0b0c10] rounded-full text-lg font-bold transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-[0_0_30px_rgba(0,240,255,0.6)]"
            >
              Открыть поток
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </motion.a>
          </div>

          {/* Right - Feed mockup with tilt on desktop */}
          <motion.div
            initial={{ opacity: 0, x: 50, rotateY: 20 }}
            whileInView={{ opacity: 1, x: 0, rotateY: -8 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: "spring", stiffness: 100, damping: 20, duration: 0.8 }}
            className="order-1 lg:order-2 w-full lg:w-auto flex justify-center lg:justify-end perspective-[1200px]"
          >
            <motion.div
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="[transform-style:preserve-3d]"
            >
              <FeedMockup />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

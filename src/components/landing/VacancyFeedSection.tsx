"use client";

import { useState, useEffect } from "react";

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
    <div
      className={`bg-white rounded-xl p-3 border border-gray-100 shadow-sm transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-sm text-gray-900 mb-0.5">{vacancy.title}</h4>
          <p className="text-xs text-gray-500">{vacancy.company}</p>
        </div>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full ${
            vacancy.source === "platform"
              ? "bg-orange-100 text-orange-600"
              : "bg-gray-100 text-gray-600"
          }`}
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
          <span key={tag} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
            {tag}
          </span>
        ))}
      </div>
    </div>
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
    <div className="bg-gray-50 rounded-2xl shadow-2xl border border-gray-200 overflow-hidden w-full max-w-[320px] sm:w-80">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Лента вакансий</h3>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-gray-500">Live</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 bg-orange-50 rounded-lg px-2 py-1.5 text-center">
            <div className="text-lg font-bold text-orange-600">127</div>
            <div className="text-[10px] text-orange-600/70">Наши</div>
          </div>
          <div className="flex-1 bg-gray-100 rounded-lg px-2 py-1.5 text-center">
            <div className="text-lg font-bold text-gray-600">2,340</div>
            <div className="text-[10px] text-gray-500">В сети</div>
          </div>
          <div className="flex-1 bg-blue-50 rounded-lg px-2 py-1.5 text-center">
            <div className="text-lg font-bold text-blue-600">2,467</div>
            <div className="text-[10px] text-blue-600/70">Всего</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-1">
          {[
            { id: "all", label: "Все" },
            { id: "platform", label: "Наши" },
            { id: "network", label: "В сети" },
          ].map((filter) => (
            <button
              key={filter.id}
              className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeFilter === filter.id
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vacancy list */}
      <div className="p-3 space-y-2 max-h-72 overflow-hidden">
        {mockVacancies.map((vacancy, i) => (
          <MockVacancyCard key={i} vacancy={vacancy} index={i} />
        ))}
      </div>

      {/* Footer */}
      <div className="bg-white px-4 py-2 border-t border-gray-100 text-center">
        <span className="text-xs text-gray-400">Обновляется каждые 2 часа</span>
      </div>
    </div>
  );
}

export default function VacancyFeedSection() {
  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-orange-50/30 to-white pointer-events-none" />

      {/* Decorative blurs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -right-32 w-64 md:w-96 h-64 md:h-96 bg-orange-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -left-32 w-48 md:w-64 h-48 md:h-64 bg-blue-100/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-12 lg:gap-20">
          {/* Left - Text content */}
          <div className="flex-1 text-center lg:text-left order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm font-medium mb-4 md:mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              Новая функция
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6">
              Лента вакансий{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">
                в реальном времени
              </span>
            </h2>
            <p className="text-base md:text-lg text-gray-600 mb-6 md:mb-8 max-w-xl mx-auto lg:mx-0">
              Больше не нужно сидеть на hh.ru и Avito. Мы собираем вакансии со всех площадок,
              фильтруем мусор и дубликаты, показываем только актуальные предложения.
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

            <a
              href="/vacancies"
              className="inline-flex items-center gap-2 px-5 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full text-sm md:text-base font-medium hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30"
            >
              Открыть ленту
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>

          {/* Right - Feed mockup with tilt on desktop */}
          <div className="flex-shrink-0 order-1 lg:order-2 w-full flex justify-center lg:block [perspective:1000px]">
            <div className="lg:[transform:rotateY(-8deg)_rotateX(2deg)] [transform-style:preserve-3d]">
              <FeedMockup />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

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

const icons: Record<string, JSX.Element> = {
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
    <section className="py-16 md:py-24 px-4 sm:px-6 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-10 md:mb-16">
          Почему мы
        </h2>
        <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="p-5 md:p-6 rounded-xl md:rounded-2xl bg-white border border-gray-100 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-500/5 transition-all duration-300"
            >
              <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center mb-4">
                {icons[benefit.icon]}
              </div>

              <h3 className="text-lg md:text-xl font-semibold mb-2">
                {benefit.title}
              </h3>

              <p className="text-sm md:text-base text-muted mb-3">
                {benefit.description}
              </p>

              {/* Метрика */}
              <p className="text-xs text-orange-600 font-medium">
                {benefit.metric}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

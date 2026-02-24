export default function EmployerBenefits() {
  const benefits = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Низкая цена",
      description: "Бесплатное размещение вакансий. Платные тарифы от 499₽/мес с дополнительными возможностями.",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: "Целевая аудитория",
      description: "Только активные соискатели. Все кандидаты уже ищут работу и готовы к собеседованиям.",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: "AI-фильтрация",
      description: "Искусственный интеллект отбирает подходящих кандидатов, экономя ваше время на поиске.",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      title: "Встроенный чат",
      description: "Общайтесь с кандидатами прямо на платформе. Всё в одном месте — никаких лишних приложений.",
    },
  ];

  return (
    <section className="py-20 px-6 bg-[#0b0c10] relative">
      {/* Decorative gradient blur */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00f0ff]/5 via-[#0b0c10] to-[#0b0c10] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            Почему <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#00b8ff] drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]">работодатели</span> выбирают нас
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Мы предлагаем современные инструменты для эффективного поиска лучших кандидатов
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="group p-8 rounded-2xl bg-[#1f2833]/50 backdrop-blur-xl border border-white/10 hover:border-[#00f0ff]/50 hover:shadow-[0_0_30px_rgba(0,240,255,0.15)] transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#00f0ff] to-[#00b8ff] text-black flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(0,240,255,0.5)] transition-all duration-300">
                {benefit.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3 tracking-wide">
                {benefit.title}
              </h3>
              <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

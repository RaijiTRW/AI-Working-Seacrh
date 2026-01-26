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
    <section className="py-16 md:py-24 px-4 sm:px-6 bg-gradient-to-b from-white via-gray-50/50 to-gray-50">
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
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              {/* Номер шага */}
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-5 shadow-lg shadow-orange-500/25">
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

              {/* Результат шага */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {step.result}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

const pains = [
  {
    emoji: "😩",
    title: "Часами листаешь hh.ru",
    description: "Одни и те же вакансии на разных площадках. Дубликаты, фейки, неактуальное.",
  },
  {
    emoji: "🎯",
    title: "Не знаешь, где искать",
    description: "hh, Avito, SuperJob, Telegram-каналы... Везде по чуть-чуть, нигде нормально.",
  },
  {
    emoji: "📝",
    title: "Рассылаешь резюме в пустоту",
    description: "Откликаешься на 50 вакансий, получаешь 2 ответа. Что делаешь не так?",
  },
  {
    emoji: "⏰",
    title: "Нет времени на это",
    description: "Работаешь, ищешь работу вечерами. Устаёшь от процесса поиска больше, чем от работы.",
  },
];

export default function PainPoints() {
  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-5xl mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            Знакомо?
          </h2>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Поиск работы превратился в работу. Мы это исправим.
          </p>
        </div>

        {/* Карточки с болями */}
        <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
          {pains.map((pain, index) => (
            <div
              key={index}
              className="p-5 md:p-6 rounded-xl md:rounded-2xl bg-white border border-gray-100 hover:border-red-100 hover:shadow-lg transition-all duration-300"
            >
              <div className="text-3xl mb-3">{pain.emoji}</div>
              <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-900">
                {pain.title}
              </h3>
              <p className="text-sm md:text-base text-muted">
                {pain.description}
              </p>
            </div>
          ))}
        </div>

        {/* Переход к решению */}
        <div className="mt-12 text-center">
          <p className="text-lg font-medium text-orange-600">
            А что если ИИ сделает это за тебя?
          </p>
          <div className="mt-4">
            <svg className="w-8 h-8 mx-auto text-orange-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";

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
    <section
      className="py-16 md:py-24 px-4 sm:px-6"
      style={{
        background: "linear-gradient(180deg, #ffffff, #f5f5f0)"
      }}
    >
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

        {/* Карточки с болями - Neumorphic */}
        <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
          {pains.map((pain, index) => (
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
                boxShadow: "12px 12px 24px rgba(160,160,160,0.3), -12px -12px 24px rgba(255,255,255,0.8), inset 0 2px 4px rgba(255,255,255,0.6)",
              }}
            >
              {/* Top highlight */}
              <div
                className="absolute top-0 left-4 right-4 h-6 rounded-b-full blur-sm pointer-events-none"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.6), transparent)",
                }}
              />

              <div className="text-3xl mb-3">{pain.emoji}</div>
              <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-900">
                {pain.title}
              </h3>
              <p className="text-sm md:text-base text-muted">
                {pain.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Переход к решению */}
        <div className="mt-12 text-center">
          <motion.p
            className="text-lg font-medium text-orange-600"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            А что если ИИ сделает это за тебя?
          </motion.p>
          <div className="mt-4">
            <svg
              className="w-8 h-8 mx-auto text-orange-400 animate-bounce"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ filter: "drop-shadow(0 4px 8px rgba(249,115,22,0.2))" }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}

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
    <section className="py-20 md:py-32 px-4 sm:px-6 bg-[#0b0c10] relative overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#1f2833]/20 pointer-events-none" />

      {/* Futuristic Grid */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5 pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Заголовок */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-6 text-white tracking-tight">
            Знакомо?
          </h2>
          <p className="text-lg md:text-xl text-[#c5c6c7] max-w-2xl mx-auto font-light leading-relaxed">
            Поиск работы превратился во вторую, неоплачиваемую работу. <br className="hidden md:block" /> Мы решили это исправить.
          </p>
        </motion.div>

        {/* Карточки с болями */}
        <div className="grid sm:grid-cols-2 gap-6 md:gap-8">
          {pains.map((pain, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="p-6 md:p-8 rounded-2xl bg-[#1f2833]/60 backdrop-blur-sm border border-[#c5c6c7]/10 hover:border-[#ff6b00]/50 transition-colors duration-300 group"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 origin-left">{pain.emoji}</div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 text-white">
                {pain.title}
              </h3>
              <p className="text-base text-[#c5c6c7]/80 leading-relaxed">
                {pain.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Переход к решению */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20 text-center"
        >
          <p className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b00] to-[#00f0ff] drop-shadow-[0_0_10px_rgba(255,107,0,0.3)]">
            А что если ИИ сделает всю грязную работу за тебя?
          </p>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="mt-8 flex justify-center"
          >
            <div className="w-12 h-12 rounded-full bg-[#1f2833]/80 border border-[#ff6b00]/30 shadow-[0_0_15px_rgba(255,107,0,0.2)] flex items-center justify-center">
              <svg className="w-6 h-6 text-[#ff6b00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

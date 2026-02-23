"use client";

import { motion } from "framer-motion";

const steps = [
  {
    number: "1",
    title: "Опиши, что ищешь",
    description: "2 минуты в чате с ИИ. Город, зарплата, формат работы — мы запомним всё до мелочей.",
    result: "Твой профиль поиска готов",
    color: "from-[#ff6b00] to-[#ff8c00]",
    shadow: "shadow-[0_0_20px_rgba(255,107,0,0.4)]"
  },
  {
    number: "2",
    title: "ИИ сканирует площадки",
    description: "hh.ru, Avito, SuperJob и другие. Каждые 2 часа мы обновляем данные 24/7.",
    result: "2000+ вакансий под контролем",
    color: "from-[#00f0ff] to-[#00c0cc]",
    shadow: "shadow-[0_0_20px_rgba(0,240,255,0.4)]"
  },
  {
    number: "3",
    title: "Получаешь релевантное",
    description: "Нейросеть отсеивает дубликаты, фейки и мусор. Тебе остаются только 5-15 лучших матчей.",
    result: "Экономия 3+ часов в день",
    color: "from-[#a200ff] to-[#7000cc]",
    shadow: "shadow-[0_0_20px_rgba(162,0,255,0.4)]"
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 md:py-32 px-4 sm:px-6 bg-[#0b0c10] relative overflow-hidden">
      {/* Dynamic line connecting steps on large screens */}
      <div className="hidden md:block absolute top-[280px] left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-[#ff6b00] via-[#00f0ff] to-[#a200ff] opacity-20 pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-24"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-6 text-white tracking-tight">
            Как мы экономим твоё время
          </h2>
          <p className="text-lg md:text-xl text-[#c5c6c7] font-light">
            От регистрации до получения первых целевых вакансий — <span className="text-[#00f0ff] font-medium">всего 5 минут</span>.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-10 md:gap-8 lg:gap-12 relative">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="relative text-center group"
            >
              {/* Glowing Number Badge */}
              <div className="relative mx-auto mb-8 w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
                <div className={`absolute inset-0 bg-gradient-to-br ${step.color} rounded-full blur-md opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className={`relative w-full h-full bg-[#1f2833] rounded-full border border-white/10 flex items-center justify-center z-10 overflow-hidden`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-20`} />
                  <span className="text-2xl md:text-3xl font-black text-white">{step.number}</span>
                </div>
              </div>

              {/* Text content */}
              <h3 className="text-xl md:text-2xl font-bold mb-4 text-white">
                {step.title}
              </h3>
              <p className="text-base text-[#c5c6c7]/80 leading-relaxed mb-6">
                {step.description}
              </p>

              {/* Result pill */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#1f2833] border border-[#c5c6c7]/20 rounded-full text-sm font-medium text-white shadow-lg"
              >
                <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${step.color} animate-pulse`} />
                {step.result}
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

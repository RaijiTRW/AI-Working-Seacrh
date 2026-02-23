import type { JSX } from "react";
import * as motion from "framer-motion/client";

const benefits = [
  {
    title: "3+ часа в день на себя",
    description: "Пока другие монотонно скроллят страницы, ты занимаешься более важными делами. ИИ ищет за тебя.",
    icon: "clock",
    metric: "Средняя ежедневная экономия времени",
    color: "from-[#ff6b00] to-[#ffa633]",
    glow: "shadow-[0_0_15px_rgba(255,107,0,0.4)]"
  },
  {
    title: "Только стоящие вакансии",
    description: "Алгоритм отсекает дубликаты, фейки и неадекватные предложения. Ты видишь только чистый концентрат.",
    icon: "filter",
    metric: "87% мусорных вакансий блокируется",
    color: "from-[#00f0ff] to-[#00c0cc]",
    glow: "shadow-[0_0_15px_rgba(0,240,255,0.4)]"
  },
  {
    title: "Все площадки в одном интерфейсе",
    description: "Перестань прыгать между 10 вкладками. Мы агрегируем данные со всех крупных порталов и соцсетей в один хаб.",
    icon: "grid",
    metric: "Агрегация с 5+ топовых ресурсов",
    color: "from-[#a200ff] to-[#7000cc]",
    glow: "shadow-[0_0_15px_rgba(162,0,255,0.4)]"
  },
  {
    title: "Персональная нейро-адаптация",
    description: "Один раз расскажи ИИ о своих ожиданиях — и алгоритм навсегда запомнит твой формат, зарплату и стек.",
    icon: "user",
    metric: "94% точность персонального мэтчинга",
    color: "from-[#00ff88] to-[#00cc6a]",
    glow: "shadow-[0_0_15px_rgba(0,255,136,0.4)]"
  },
];

const icons: Record<string, JSX.Element> = {
  clock: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  filter: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  ),
  grid: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  user: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
};

export default function Benefits() {
  return (
    <section className="py-20 md:py-32 px-4 sm:px-6 bg-[#0b0c10] relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#1f2833] to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#1f2833]/10 to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-24"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-4">
            Почему <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b00] to-[#00f0ff]">JobAISearch</span>?
          </h2>
          <p className="text-lg text-[#c5c6c7] max-w-2xl mx-auto">
            Технологическое превосходство над рутиной классического поиска.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-6 md:gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group relative p-8 md:p-10 rounded-3xl bg-[#1f2833]/40 backdrop-blur-sm border border-[#c5c6c7]/10 transition-all duration-300 overflow-hidden"
            >
              {/* Card Hover Glow Effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
              <div className={`absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br ${benefit.color} opacity-0 group-hover:opacity-10 rounded-full blur-3xl transition-opacity duration-700 pointer-events-none`} />

              <div className="relative z-10">
                <div className={`mb-6 inline-flex p-3 rounded-2xl bg-[#0b0c10] border border-[#c5c6c7]/10 text-white relative`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${benefit.color} blur-md opacity-20`} />
                  <div className="relative z-10 text-white mix-blend-screen">{icons[benefit.icon]}</div>
                </div>

                <h3 className="text-xl md:text-2xl font-bold mb-3 text-white tracking-tight">
                  {benefit.title}
                </h3>

                <p className="text-base text-[#c5c6c7]/80 mb-6 leading-relaxed font-light">
                  {benefit.description}
                </p>

                {/* Badge Metric */}
                <div className="inline-flex items-center mt-auto">
                  <div className={`h-px w-6 bg-gradient-to-r ${benefit.color} mr-3`} />
                  <p className="text-xs uppercase tracking-widest font-bold text-[#c5c6c7]">
                    {benefit.metric}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

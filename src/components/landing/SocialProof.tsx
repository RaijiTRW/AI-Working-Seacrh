"use client";

import { motion } from "framer-motion";

const stats = [
  {
    value: "40,340+",
    label: "вакансий в базе",
    subLabel: "обновляется каждые 2 часа",
    color: "text-[#00f0ff]",
    glow: "drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]"
  },
  {
    value: "87%",
    label: "нерелевантных отфильтровано",
    subLabel: "дубликаты, фейки, неактуальные",
    color: "text-[#ff6b00]",
    glow: "drop-shadow-[0_0_10px_rgba(255,107,0,0.5)]"
  },
  {
    value: "5 мин",
    label: "до первых вакансий",
    subLabel: "от регистрации до результата",
    color: "text-[#00ff88]",
    glow: "drop-shadow-[0_0_10px_rgba(0,255,136,0.5)]"
  },
  {
    value: "2+",
    label: "площадок сканируем",
    subLabel: "hh, Avito, SuperJob и другие",
    color: "text-[#a200ff]",
    glow: "drop-shadow-[0_0_10px_rgba(162,0,255,0.5)]"
  },
];

export default function SocialProof() {
  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 bg-[#0b0c10] relative overflow-hidden border-y border-[#1f2833]">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-[#1f2833]/20" />
      <div className="absolute top-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-[#ff6b00] to-transparent opacity-50" />
      <div className="absolute bottom-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent opacity-50" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center group"
            >
              <div className={`text-4xl md:text-5xl lg:text-5xl font-black mb-3 ${stat.color} ${stat.glow} font-mono tracking-tighter group-hover:scale-110 transition-transform duration-300`}>
                {stat.value}
              </div>
              <div className="text-sm md:text-base font-bold text-white mb-2 uppercase tracking-wide">
                {stat.label}
              </div>
              <div className="text-xs md:text-sm text-[#c5c6c7]/60 font-light">
                {stat.subLabel}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";

const stats = [
  {
    value: "2,340+",
    label: "вакансий в базе",
    subLabel: "обновляется каждые 2 часа",
  },
  {
    value: "87%",
    label: "нерелевантных отфильтровано",
    subLabel: "дубликаты, фейки, неактуальные",
  },
  {
    value: "5 мин",
    label: "до первых вакансий",
    subLabel: "от регистрации до результата",
  },
  {
    value: "5+",
    label: "площадок сканируем",
    subLabel: "hh, Avito, SuperJob и другие",
  },
];

export default function SocialProof() {
  return (
    <section
      className="py-16 md:py-20 px-4 sm:px-6"
      style={{
        background: "linear-gradient(135deg, #f97316, #ea580c)",
        boxShadow: "inset 0 2px 4px rgba(255,255,255,0.2), inset 0 -2px 6px rgba(200,80,0,0.15)"
      }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center text-white"
            >
              <div className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 relative">
                {/* Glow behind numbers */}
                <span
                  className="absolute inset-0 blur-xl -z-10"
                  style={{
                    background: "radial-gradient(circle at center, rgba(255,255,255,0.3), transparent 70%)",
                  }}
                />
                {stat.value}
              </div>
              <div className="text-sm md:text-base font-medium opacity-90 mb-1">
                {stat.label}
              </div>
              <div className="text-xs opacity-70">
                {stat.subLabel}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

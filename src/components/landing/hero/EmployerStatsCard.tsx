"use client";

import { motion } from "framer-motion";

const stats = [
  { label: "Активных соискателей", value: "1,500+", icon: "👥" },
  { label: "Размещений", value: "Бесплатно", icon: "💰" },
  { label: "AI-фильтрация", value: "Включена", icon: "✨" },
];

export default function EmployerStatsCard() {
  return (
    <div
      className="relative rounded-3xl p-5 w-64"
      style={{
        background: "linear-gradient(145deg, #ffffff, #f0f0f0)",
        boxShadow: "24px 24px 48px rgba(100,140,200,0.25), -24px -24px 48px rgba(255,255,255,0.9), inset 0 2px 4px rgba(255,255,255,0.6)",
      }}
    >
      {/* Ambient Blue Glow */}
      <div
        className="absolute inset-0 rounded-3xl blur-3xl -z-10"
        style={{
          background: "radial-gradient(circle at 50% 20%, rgba(59,130,246,0.3), transparent 60%)",
        }}
      />

      {/* Top highlight streak */}
      <div
        className="absolute top-0 left-4 right-4 h-8 rounded-b-full blur-md pointer-events-none"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.7), transparent)",
        }}
      />

      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-blue-100/50">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-9 h-9 rounded-full flex items-center justify-center relative overflow-hidden"
          style={{
            background: "linear-gradient(145deg, #60a5fa, #1d4ed8)",
            boxShadow: "6px 6px 12px rgba(30,80,200,0.3), -3px -3px 8px rgba(150,200,255,0.3), inset 0 2px 4px rgba(255,255,255,0.3)"
          }}
        >
          <motion.div
            className="absolute inset-0"
            animate={{
              x: ["-100%", "200%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 2,
            }}
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
            }}
          />
          <span className="text-white text-xs font-bold relative z-10">📊</span>
        </motion.div>
        <span className="text-sm font-medium">Статистика платформы</span>
      </div>

      <div className="space-y-3">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: i * 0.2,
              ease: [0.22, 1, 0.36, 1]
            }}
            whileHover={{ scale: 1.02, translateY: -2 }}
            className="p-3 rounded-xl relative overflow-hidden"
            style={{
              background: "linear-gradient(145deg, #eff6ff, #dbeafe)",
              boxShadow: "4px 4px 10px rgba(30,80,200,0.12), -3px -3px 8px rgba(200,230,255,0.5), inset 0 1px 2px rgba(255,255,255,0.6)",
              border: "1px solid rgba(59,130,246,0.15)"
            }}
          >
            {/* Shimmer on hover */}
            <motion.div
              className="absolute inset-0"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.6 }}
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
              }}
            />
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <motion.span
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                  className="text-lg"
                >
                  {stat.icon}
                </motion.span>
                <span className="text-xs text-gray-600">{stat.label}</span>
              </div>
              <span className="text-sm font-bold text-blue-600">{stat.value}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-blue-100/50">
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-full text-sm text-gray-400"
          style={{
            background: "linear-gradient(145deg, #fafafa, #e5e5e5)",
            boxShadow: "inset 3px 3px 6px rgba(150,150,150,0.15), inset -2px -2px 4px rgba(255,255,255,0.7)"
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Быстрый подбор</span>
        </div>
      </div>
    </div>
  );
}

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
      className="relative rounded-3xl p-5 w-64 overflow-hidden"
      style={{
        background: "linear-gradient(145deg, #ffffff, #f8f8f8)",
        boxShadow: "0 20px 45px rgba(59,130,246,0.15), 0 8px 18px rgba(0,0,0,0.06), inset 0 2px 0 rgba(255,255,255,0.95), inset 0 -1px 4px rgba(59,130,246,0.04)",
      }}
    >
      {/* Gradient Border */}
      <div
        className="absolute inset-0 rounded-3xl pointer-events-none"
        style={{
          padding: "1px",
          background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(255,255,255,0.4), rgba(59,130,246,0.15))",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />

      {/* Ambient Glow */}
      <div
        className="absolute inset-0 rounded-3xl blur-2xl -z-10"
        style={{
          background: "radial-gradient(circle at 50% 20%, rgba(59,130,246,0.25), transparent 60%)",
        }}
      />

      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-blue-100/50">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-9 h-9 rounded-full flex items-center justify-center relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #60a5fa, #2563eb)",
            boxShadow: "0 6px 16px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 4px rgba(0,0,0,0.1)"
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
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
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
            whileHover={{ scale: 1.02, y: -2 }}
            className="p-3 rounded-xl relative overflow-hidden"
            style={{
              background: "linear-gradient(145deg, #eff6ff, #dbeafe)",
              boxShadow: "0 3px 10px rgba(59,130,246,0.12), inset 0 1px 0 rgba(255,255,255,0.8)",
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
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
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
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="flex items-center gap-2 px-3 py-2.5 rounded-full text-sm text-gray-400"
          style={{
            background: "linear-gradient(145deg, #fafafa, #f0f0f0)",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.8)"
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Быстрый подбор</span>
        </motion.div>
      </div>
    </div>
  );
}

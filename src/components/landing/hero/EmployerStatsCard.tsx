"use client";

import { motion } from "framer-motion";

const stats = [
  { label: "Активных соискателей", value: "1,500+", icon: "👥" },
  { label: "Размещений", value: "Бесплатно", icon: "💰" },
  { label: "AI-фильтрация", value: "Включена", icon: "✨" },
];

export default function EmployerStatsCard() {
  return (
    <div className="soft-card-base soft-card-blue rounded-3xl p-4 w-64 border border-blue-50/50">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-blue-100/50">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
          style={{
            background: "linear-gradient(135deg, #60a5fa, #2563eb)",
            boxShadow: "0 4px 12px rgba(59,130,246,0.25), inset 0 1px 0 rgba(255,255,255,0.3)"
          }}
        >
          <span className="text-white text-xs font-bold">📊</span>
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
            whileHover={{ scale: 1.02, y: -1 }}
            className="p-3 rounded-xl border shadow-[0_2px_8px_rgba(59,130,246,0.08),inset_0_1px_0_rgba(255,255,255,0.8)]"
            style={{
              background: "linear-gradient(180deg, rgba(239,246,255,0.9), rgba(219,234,254,0.7))",
              borderColor: "rgba(59,130,246,0.15)"
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.span
                  animate={{ scale: [1, 1.1, 1] }}
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
          className="flex items-center gap-2 px-3 py-2 rounded-full text-sm text-gray-400 shadow-[inset_0_1px_3px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.8)]"
          style={{ background: "linear-gradient(180deg, #fafafa, #f5f5f5)" }}
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

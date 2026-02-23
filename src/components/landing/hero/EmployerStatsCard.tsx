"use client";

import { motion } from "framer-motion";

const stats = [
  { label: "Активных соискателей", value: "1,500+", icon: "👥" },
  { label: "Размещений", value: "Бесплатно", icon: "💰" },
  { label: "AI-фильтрация", value: "Включена", icon: "✨" },
];

export default function EmployerStatsCard() {
  return (
    <div className="bg-[#1f2833]/80 backdrop-blur-md rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-4 w-72 border border-[#c5c6c7]/10">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#c5c6c7]/10">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00f0ff] to-[#00c0cc] flex items-center justify-center shadow-[0_0_10px_rgba(0,240,255,0.4)]">
          <span className="text-white text-xs font-bold">📊</span>
        </div>
        <span className="text-sm font-medium text-white">Статистика платформы</span>
      </div>
      <div className="space-y-3">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.2 }}
            className="p-3 rounded-xl bg-[#0b0c10] border border-[#c5c6c7]/10"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{stat.icon}</span>
                <span className="text-xs text-[#c5c6c7]">{stat.label}</span>
              </div>
              <span className="text-sm font-bold text-[#00f0ff] drop-shadow-[0_0_5px_rgba(0,240,255,0.3)]">{stat.value}</span>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-[#c5c6c7]/10">
        <div className="flex items-center gap-2 px-3 py-2 bg-[#0b0c10] rounded-full text-sm text-[#c5c6c7]/70 border border-[#c5c6c7]/5">
          <svg className="w-4 h-4 text-[#00f0ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="animate-pulse">Ускоренный поиск кадров</span>
        </div>
      </div>
    </div>
  );
}

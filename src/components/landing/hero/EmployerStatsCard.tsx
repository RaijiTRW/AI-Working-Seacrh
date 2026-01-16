"use client";

const stats = [
  { label: "Активных соискателей", value: "1,500+", icon: "👥" },
  { label: "Размещений", value: "Бесплатно", icon: "💰" },
  { label: "AI-фильтрация", value: "Включена", icon: "✨" },
];

export default function EmployerStatsCard() {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 w-64 border border-gray-100">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">📊</span>
        </div>
        <span className="text-sm font-medium">Статистика платформы</span>
      </div>
      <div className="space-y-3">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="p-3 rounded-xl bg-blue-50 border border-blue-100 animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{
              animationDelay: `${i * 200}ms`,
              animationFillMode: "backwards",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{stat.icon}</span>
                <span className="text-xs text-gray-600">{stat.label}</span>
              </div>
              <span className="text-sm font-bold text-blue-600">{stat.value}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-full text-sm text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Быстрый подбор</span>
        </div>
      </div>
    </div>
  );
}

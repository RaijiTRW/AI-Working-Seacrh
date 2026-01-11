import type { JSX } from "react";

const features = [
  { icon: "clock", text: "Экономия времени" },
  { icon: "filter", text: "Без мусора и дубликатов" },
  { icon: "search", text: "Все сайты в одном месте" },
];

function FeatureCard({ icon, text, delay }: { icon: string; text: string; delay: number }) {
  const icons: Record<string, JSX.Element> = {
    clock: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    filter: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
      </svg>
    ),
    search: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  };

  return (
    <div
      className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg border border-white/50 animate-in fade-in slide-in-from-left-4 duration-500"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
    >
      <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-500 flex items-center justify-center">
        {icons[icon]}
      </div>
      <span className="text-sm font-medium text-gray-700">{text}</span>
    </div>
  );
}

export default function AuthHero() {
  return (
    <div className="hidden lg:flex flex-col justify-center h-full p-12 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-orange-100" />

      {/* Decorative blurs */}
      <div className="absolute top-20 -left-20 w-72 h-72 bg-orange-200/50 rounded-full blur-3xl" />
      <div className="absolute bottom-20 -right-20 w-72 h-72 bg-orange-300/30 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10 max-w-lg">
        <h1 className="text-4xl xl:text-5xl font-bold text-gray-900 leading-tight mb-6">
          Найди{" "}
          <span className="relative inline-block">
            <span className="relative z-10 italic text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">
              работу мечты
            </span>
            <svg
              className="absolute -bottom-1 left-0 w-full h-2 text-orange-400"
              viewBox="0 0 200 8"
              fill="none"
              preserveAspectRatio="none"
            >
              <path
                d="M0,4 Q50,0 100,4 T200,4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </span>{" "}
          за минуты
        </h1>

        <p className="text-lg text-gray-600 mb-10">
          ИИ подберёт лучшие вакансии со всех сайтов. Без мусора, курьеров и одинаковых предложений.
        </p>

        {/* Feature cards */}
        <div className="space-y-3">
          {features.map((feature, i) => (
            <FeatureCard key={i} {...feature} delay={i * 150 + 300} />
          ))}
        </div>
      </div>

      {/* Decorative vacancy card */}
      <div
        className="absolute bottom-24 right-8 bg-white rounded-xl shadow-xl p-4 w-52 border border-gray-100 animate-in fade-in slide-in-from-right-4 duration-700"
        style={{ transform: "rotate(-3deg)", animationDelay: "600ms", animationFillMode: "backwards" }}
      >
        <div className="text-xs text-gray-400 mb-1">Найдено для тебя</div>
        <h4 className="font-semibold text-sm mb-1">Маркетолог</h4>
        <p className="text-orange-500 font-bold text-sm">от 90 000 ₽</p>
        <p className="text-xs text-gray-500">Удалённо</p>
      </div>
    </div>
  );
}

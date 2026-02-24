import type { JSX } from "react";

const features = [
  { icon: "clock", text: "Экономия времени" },
  { icon: "filter", text: "Поиск вакансий под вас" },
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
      className="flex items-center gap-3 bg-[#1f2833]/50 backdrop-blur-xl rounded-xl px-4 py-3 shadow-xl border border-white/10 animate-in fade-in slide-in-from-left-4 duration-500"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
    >
      <div className="w-10 h-10 rounded-lg bg-[#ff6b00]/20 text-[#ff6b00] flex items-center justify-center border border-[#ff6b00]/20 shadow-[0_0_10px_rgba(255,107,0,0.2)]">
        {icons[icon]}
      </div>
      <span className="text-sm font-medium text-gray-300">{text}</span>
    </div>
  );
}

export default function AuthHero() {
  return (
    <div className="hidden lg:flex flex-col justify-center h-full p-12 relative overflow-hidden bg-[#0b0c10]">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10 pointer-events-none" />

      {/* Decorative blurs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#ff6b00]/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#00f0ff]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-lg">
        <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
          Найди{" "}
          <span className="relative inline-block">
            <span className="relative z-10 italic text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b00] to-[auto]">
              работу мечты
            </span>
            <svg
              className="absolute -bottom-1 left-0 w-full h-2 text-[#ff6b00]"
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
                style={{ filter: "drop-shadow(0 0 4px rgba(255,107,0,0.5))" }}
              />
            </svg>
          </span>{" "}
          за минуты
        </h1>

        <p className="text-lg text-gray-400 mb-10">
          ИИ подберёт лучшие вакансии со всех сайтов. Без лишних нервов, курьеров и одинаковых предложений.
        </p>

        {/* Feature cards */}
        <div className="space-y-4">
          {features.map((feature, i) => (
            <FeatureCard key={i} {...feature} delay={i * 150 + 300} />
          ))}
        </div>
      </div>

      {/* Decorative vacancy card */}
      <div
        className="absolute bottom-24 right-8 bg-[#1f2833]/80 backdrop-blur-xl rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-5 w-56 border border-white/10 animate-in fade-in slide-in-from-right-4 duration-700"
        style={{ transform: "rotate(-3deg)", animationDelay: "600ms", animationFillMode: "backwards" }}
      >
        <div className="text-xs text-[#00f0ff] mb-1.5 font-medium tracking-wide">Найдено для тебя</div>
        <h4 className="font-semibold text-white text-base mb-1.5">Маркетолог</h4>
        <p className="text-[#ff6b00] font-bold text-sm mb-2 drop-shadow-[0_0_8px_rgba(255,107,0,0.4)]">от 90 000 ₽</p>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] shadow-[0_0_5px_#00ff88]"></span>
          <p className="text-xs text-gray-400">Удалённо</p>
        </div>
      </div>
    </div>
  );
}

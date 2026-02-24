"use client";

import { useAuth } from "@/lib/useAuth";

export default function EmployerPricing() {
  const { user } = useAuth();

  const plans = [
    {
      name: "Бесплатно",
      price: "0₽",
      period: "навсегда",
      description: "Идеально для начала",
      features: [
        "1 активная вакансия",
        "Базовая статистика",
        "Доступ к чату",
        "Поддержка 24/7",
      ],
      cta: "Начать бесплатно",
      ctaLink: user ? "/vacancies/create" : "/auth",
      highlighted: false,
    },
    {
      name: "Стандарт",
      price: "499₽",
      period: "в месяц",
      description: "Для активного найма",
      features: [
        "5 активных вакансий",
        "AI-фильтрация резюме",
        "Детальная аналитика",
        "Приоритетная поддержка",
        "Выделение вакансий",
      ],
      cta: "Попробовать",
      ctaLink: user ? "/subscription" : "/auth",
      highlighted: true,
      badge: "Популярный",
    },
    {
      name: "Бизнес",
      price: "1999₽",
      period: "в месяц",
      description: "Для крупных компаний",
      features: [
        "Неограниченно вакансий",
        "Продвинутая AI-фильтрация",
        "Полная аналитика + отчёты",
        "Персональный менеджер",
        "Брендирование профиля",
        "Интеграция с ATS",
      ],
      cta: "Связаться с нами",
      ctaLink: user ? "/subscription" : "/auth",
      highlighted: false,
    },
  ];

  return (
    <section className="py-20 px-6 bg-[#0b0c10] relative">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            Выберите подходящий тариф
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Прозрачное ценообразование без скрытых комиссий
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-8 border backdrop-blur-xl transition-all duration-300 flex flex-col ${plan.highlighted
                  ? "bg-[#1f2833]/80 border-[#00f0ff]/50 shadow-[0_0_30px_rgba(0,240,255,0.15)] scale-105"
                  : "bg-[#1f2833]/40 border-white/10 hover:border-[#ff6b00]/30 hover:shadow-[0_0_20px_rgba(255,107,0,0.1)]"
                }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#00f0ff] to-[#00b8ff] text-black text-sm font-bold rounded-full shadow-[0_0_15px_rgba(0,240,255,0.5)]">
                  {plan.badge}
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm text-gray-400 mb-4">{plan.description}</p>
                <div className="flex items-end justify-center gap-1">
                  <span className={`text-4xl font-bold ${plan.highlighted ? "text-[#00f0ff] drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]" : "text-white"}`}>
                    {plan.price}
                  </span>
                  <span className="text-gray-500 pb-1">/{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <svg
                      className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.highlighted ? "text-[#00f0ff] drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]" : "text-[#00ff88] drop-shadow-[0_0_5px_rgba(0,255,136,0.3)]"}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-sm text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href={plan.ctaLink}
                className={`block w-full py-3 rounded-xl text-center font-bold transition-all ${plan.highlighted
                    ? "bg-gradient-to-r from-[#00f0ff] to-[#00b8ff] text-black hover:shadow-[0_0_20px_rgba(0,240,255,0.6)]"
                    : "bg-white/10 text-white hover:bg-white/20 border border-white/5"
                  }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-400">
            Все тарифы включают доступ к базовым функциям платформы.{" "}
            <a href="#" className="text-[#00f0ff] hover:text-[#00c0cc] hover:underline transition-colors">
              Сравнить тарифы →
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

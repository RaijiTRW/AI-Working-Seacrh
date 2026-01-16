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
    <section className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Выберите подходящий тариф
          </h2>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Прозрачное ценообразование без скрытых комиссий
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-8 border-2 transition-all duration-300 ${
                plan.highlighted
                  ? "bg-blue-50 border-blue-500 shadow-xl scale-105"
                  : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-lg"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-full shadow-lg">
                  {plan.badge}
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm text-muted mb-4">{plan.description}</p>
                <div className="flex items-end justify-center gap-1">
                  <span className="text-4xl font-bold text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-muted pb-1">/{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
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
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href={plan.ctaLink}
                className={`block w-full py-3 rounded-xl text-center font-medium transition-all ${
                  plan.highlighted
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl"
                    : "bg-gray-100 text-foreground hover:bg-gray-200"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted">
            Все тарифы включают доступ к базовым функциям платформы.{" "}
            <a href="#" className="text-blue-500 hover:underline">
              Сравнить тарифы →
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

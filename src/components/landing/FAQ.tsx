"use client";

import { useState } from "react";

const faqs = [
  {
    question: "Как работает сервис?",
    answer:
      "Ты рассказываешь, какую работу ищешь, через простой чат. ИИ уточняет детали, затем ищет вакансии по всем популярным сайтам, фильтрует мусор и выдаёт тебе только подходящие варианты.",
  },
  {
    question: "Откуда берутся вакансии?",
    answer:
      "Мы собираем вакансии с Avito, hh.ru, SuperJob и других популярных площадок. Ты получаешь доступ ко всем сайтам в одном месте.",
  },
  {
    question: "Сколько это стоит?",
    answer:
      "Первый подбор бесплатный. Дальше — подписка от 299 рублей в месяц или разовая оплата за подбор.",
  },
  {
    question: "Как быстро получу результат?",
    answer:
      "Обычно в течение нескольких минут. Зависит от количества вакансий в твоей сфере.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-24 px-6 bg-gradient-to-b from-white via-gray-50/30 to-gray-50">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
          Частые вопросы
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-orange-100 transition-colors"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-orange-50/50 transition-colors"
              >
                <span className="font-medium">{faq.question}</span>
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    openIndex === index
                      ? "bg-orange-500 text-white rotate-45"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? "max-h-48" : "max-h-0"
                }`}
              >
                <div className="px-6 pb-5 text-muted">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

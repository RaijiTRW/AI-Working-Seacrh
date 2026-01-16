"use client";

import { useState } from "react";

export default function EmployerFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "Сколько стоит размещение вакансий?",
      answer: "Размещение первой вакансии — бесплатно навсегда. Для размещения большего количества вакансий и доступа к AI-фильтрации доступны платные тарифы от 499₽/мес.",
    },
    {
      question: "Как работает AI-фильтрация кандидатов?",
      answer: "Наш искусственный интеллект анализирует резюме соискателей, сравнивает их с требованиями вакансии и автоматически отбирает наиболее подходящих кандидатов. Это экономит ваше время на первичном отборе.",
    },
    {
      question: "Могу ли я отменить подписку в любой момент?",
      answer: "Да, вы можете отменить подписку в любой момент без штрафов и скрытых комиссий. После отмены подписка будет активна до конца оплаченного периода.",
    },
    {
      question: "Какая аудитория платформы?",
      answer: "На платформе зарегистрировано более 1500 активных соискателей из разных городов России. Все пользователи проходят верификацию, что гарантирует качество откликов.",
    },
  ];

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Часто задаваемые вопросы
          </h2>
          <p className="text-lg text-muted">
            Ответы на популярные вопросы от работодателей
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-foreground pr-8">
                  {faq.question}
                </span>
                <svg
                  className={`w-5 h-5 text-blue-500 flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? "max-h-96" : "max-h-0"
                }`}
              >
                <div className="px-6 pb-5 text-muted leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted mb-4">Не нашли ответ на свой вопрос?</p>
          <a
            href="/auth"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-600 rounded-xl font-medium hover:bg-blue-100 transition-all"
          >
            Связаться с поддержкой
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}

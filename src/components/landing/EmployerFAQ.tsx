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
    <section className="py-20 px-6 bg-[#0b0c10] relative overflow-hidden">
      {/* Decorative blurred glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-[#00f0ff] rounded-full mix-blend-screen filter blur-[200px] opacity-5 pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            Часто задаваемые вопросы
          </h2>
          <p className="text-lg text-gray-400">
            Ответы на популярные вопросы от работодателей
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-[#1f2833]/50 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,240,255,0.1)] hover:border-[#00f0ff]/30"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
              >
                <span className="font-semibold text-white pr-8 text-lg">
                  {faq.question}
                </span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 ${openIndex === index ? "bg-[#00f0ff]/20 text-[#00f0ff]" : "bg-white/5 text-gray-400"
                  }`}>
                  <svg
                    className={`w-5 h-5 transition-transform duration-300 ${openIndex === index ? "rotate-180" : ""
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
                </div>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${openIndex === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  }`}
              >
                <div className="px-6 pb-5 text-gray-400 leading-relaxed border-t border-white/5 mt-2 pt-4">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-400 mb-4">Не нашли ответ на свой вопрос?</p>
          <a
            href="/auth"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1f2833]/80 border border-white/10 text-[#00f0ff] rounded-xl font-medium hover:bg-[#1f2833] hover:border-[#00f0ff]/50 hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all"
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

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";

const chatMessages = [
  { type: "bot", text: "Какую работу ищешь?" },
  { type: "user", text: "Москва, офисная работа" },
  { type: "user", text: "Опыт 2+ года" },
  { type: "user", text: "Зарплата от 80 000 ₽" },
  { type: "bot", text: "Отлично! Ищу подходящие вакансии..." },
];

const vacancies = [
  {
    title: "Менеджер по продажам",
    salary: "от 90 000 ₽",
    location: "Офис, Москва",
    schedule: "График: 5/2",
  },
  {
    title: "Маркетолог",
    salary: "80 000 - 100 000 ₽",
    location: "Удалённо",
    experience: "Опыт: 2+ года",
  },
  {
    title: "Аналитик данных",
    salary: "120 000 - 150 000 ₽",
    location: "Гибрид, Москва",
    experience: "Опыт: 3+ года",
  },
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  );
}

function ChatCard() {
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [showTyping, setShowTyping] = useState(false);
  const [typingType, setTypingType] = useState<"bot" | "user">("bot");

  useEffect(() => {
    const showNextMessage = () => {
      if (visibleMessages < chatMessages.length) {
        const nextMessage = chatMessages[visibleMessages];
        setTypingType(nextMessage.type as "bot" | "user");
        setShowTyping(true);

        setTimeout(() => {
          setShowTyping(false);
          setVisibleMessages((prev) => prev + 1);
        }, nextMessage.type === "bot" ? 1500 : 800);
      } else {
        setTimeout(() => {
          setVisibleMessages(0);
        }, 3000);
      }
    };

    const timer = setTimeout(showNextMessage, visibleMessages === 0 ? 500 : 1000);
    return () => clearTimeout(timer);
  }, [visibleMessages]);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 w-64 border border-gray-100">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">AI</span>
        </div>
        <span className="text-sm font-medium">Ваши пожелания по работе?</span>
      </div>
      <div className="space-y-2 min-h-36">
        {chatMessages.slice(0, visibleMessages).map((msg, i) => (
          <div
            key={i}
            className={`px-3 py-2 rounded-xl text-sm animate-in fade-in slide-in-from-bottom-2 duration-300 ${
              msg.type === "bot"
                ? "bg-gray-100 text-gray-700 mr-8"
                : "bg-orange-50 text-orange-700 ml-8 border border-orange-100"
            }`}
          >
            {msg.text}
          </div>
        ))}
        {showTyping && (
          <div
            className={`px-3 py-2.5 rounded-xl ${
              typingType === "bot"
                ? "bg-gray-100 mr-8"
                : "bg-orange-50 ml-8 border border-orange-100"
            }`}
          >
            <TypingDots />
          </div>
        )}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-full text-sm text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>Поиск работы...</span>
        </div>
      </div>
    </div>
  );
}

function VacancyCard({ vacancy, index }: { vacancy: typeof vacancies[0]; index: number }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-white rounded-xl shadow-lg p-4 w-56 border border-gray-100 transition-all duration-500 animate-in fade-in slide-in-from-right-4"
      style={{
        animationDelay: `${index * 400}ms`,
        animationFillMode: "backwards",
        transform: isHovered ? "scale(1.02) translateX(-4px)" : "scale(1)",
      }}
    >
      <h4 className="font-semibold text-sm mb-2">{vacancy.title}</h4>
      <p className="text-orange-500 font-bold text-sm mb-2">{vacancy.salary}</p>
      <p className="text-xs text-gray-500 mb-1">{vacancy.location}</p>
      <p className="text-xs text-gray-500 mb-3">
        {vacancy.schedule || vacancy.experience}
      </p>
      <button className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs rounded-full hover:from-orange-600 hover:to-orange-700 transition-all">
        Откликнуться
      </button>
    </div>
  );
}

export default function Hero() {
  const { user } = useAuth();

  return (
    <section className="min-h-screen flex items-center justify-center pt-20 px-6 relative overflow-hidden">
      {/* Background - extends to other sections */}
      <div className="absolute inset-0 bg-gradient-to-b from-orange-50/50 via-white to-white pointer-events-none" />

      {/* Decorative blurs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-32 w-96 h-96 bg-orange-200/40 rounded-full blur-3xl" />
        <div className="absolute top-40 -right-32 w-96 h-96 bg-orange-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/4 w-64 h-64 bg-blue-100/20 rounded-full blur-3xl" />
      </div>

      {/* Wave decoration */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg
          className="w-full text-white"
          viewBox="0 0 1440 120"
          fill="currentColor"
          preserveAspectRatio="none"
        >
          <path d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,90 1440,80 L1440,120 L0,120 Z" opacity="0.5" />
          <path d="M0,80 C360,40 720,100 1080,60 C1260,40 1380,60 1440,80 L1440,120 L0,120 Z" />
        </svg>
      </div>

      {/* Left cards - Chat */}
      <div
        className="hidden lg:block absolute left-8 xl:left-20 top-1/2 -translate-y-1/2"
        style={{ perspective: "1000px" }}
      >
        <div style={{ transform: "rotateY(12deg) rotateX(2deg)" }}>
          <ChatCard />
        </div>
      </div>

      {/* Right cards - Vacancies */}
      <div
        className="hidden lg:block absolute right-8 xl:right-20 top-1/2 -translate-y-1/2"
        style={{ perspective: "1000px" }}
      >
        <div
          className="space-y-3"
          style={{ transform: "rotateY(-12deg) rotateX(2deg)" }}
        >
          {vacancies.map((vacancy, i) => (
            <VacancyCard key={i} vacancy={vacancy} index={i} />
          ))}
        </div>
      </div>

      {/* Center content */}
      <div className="max-w-2xl mx-auto text-center relative z-10">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
          Мы ищем{" "}
          <span className="relative inline-block">
            <span className="relative z-10 italic text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">
              работу за тебя
            </span>
            {/* Волнистое подчёркивание */}
            <svg
              className="absolute -bottom-2 left-0 w-full h-3 text-orange-400"
              viewBox="0 0 200 12"
              fill="none"
              preserveAspectRatio="none"
            >
              <path
                d="M0,6 Q25,0 50,6 T100,6 T150,6 T200,6"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </span>
        </h1>
        <p className="text-lg md:text-xl text-muted max-w-xl mx-auto mb-10">
          Быстрый и надёжный поиск вакансий с помощью ИИ.
        </p>
        <a
          href={user ? "/chat" : "/auth"}
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full text-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5"
        >
          {user ? "Перейти к поиску" : "Найти вакансии"}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </section>
  );
}

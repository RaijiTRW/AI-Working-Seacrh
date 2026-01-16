"use client";

import { useEffect, useState } from "react";

const chatMessages = [
  { type: "bot", text: "Какую работу ищешь?" },
  { type: "user", text: "Москва, офисная работа" },
  { type: "user", text: "Опыт 2+ года" },
  { type: "user", text: "Зарплата от 80 000 ₽" },
  { type: "bot", text: "Отлично! Ищу подходящие вакансии..." },
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

export default function ChatCard() {
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

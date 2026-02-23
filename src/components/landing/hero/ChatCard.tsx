"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
      <motion.span animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity }} className="w-2 h-2 bg-[#c5c6c7] rounded-full" />
      <motion.span animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-2 h-2 bg-[#c5c6c7] rounded-full" />
      <motion.span animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-2 h-2 bg-[#c5c6c7] rounded-full" />
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
    <div className="bg-[#1f2833]/80 backdrop-blur-md rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-4 w-72 border border-[#c5c6c7]/10">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#c5c6c7]/10">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff6b00] to-[#ff8c00] flex items-center justify-center shadow-[0_0_10px_rgba(255,107,0,0.4)]">
          <span className="text-white text-xs font-bold">AI</span>
        </div>
        <span className="text-sm font-medium text-white">Ваши пожелания по работе?</span>
      </div>
      <div className="space-y-3 min-h-[160px] flex flex-col justify-end">
        <AnimatePresence>
          {chatMessages.slice(0, visibleMessages).map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`px-3 py-2 rounded-xl text-sm ${msg.type === "bot"
                  ? "bg-[#0b0c10] text-[#c5c6c7] mr-8 rounded-tl-sm border border-[#c5c6c7]/5"
                  : "bg-[#ff6b00]/10 text-white ml-8 rounded-tr-sm border border-[#ff6b00]/20"
                }`}
            >
              {msg.text}
            </motion.div>
          ))}
          {showTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`px-3 py-2.5 rounded-xl w-fit ${typingType === "bot"
                  ? "bg-[#0b0c10] mr-8 rounded-tl-sm border border-[#c5c6c7]/5"
                  : "bg-[#ff6b00]/10 ml-8 rounded-tr-sm border border-[#ff6b00]/20"
                }`}
            >
              <TypingDots />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="mt-4 pt-3 border-t border-[#c5c6c7]/10">
        <div className="flex items-center gap-2 px-3 py-2 bg-[#0b0c10] rounded-full text-sm text-[#c5c6c7]/70 border border-[#c5c6c7]/5">
          <svg className="w-4 h-4 text-[#ff6b00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="animate-pulse">Поиск идеальной работы...</span>
        </div>
      </div>
    </div>
  );
}

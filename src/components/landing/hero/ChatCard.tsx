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
      <motion.span
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
        className="w-2 h-2 bg-gray-400 rounded-full"
      />
      <motion.span
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
        className="w-2 h-2 bg-gray-400 rounded-full"
      />
      <motion.span
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
        className="w-2 h-2 bg-gray-400 rounded-full"
      />
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
    <div className="soft-card-base soft-card-orange rounded-3xl p-4 w-64 border border-orange-50/50">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-orange-100/50">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
          style={{
            background: "linear-gradient(135deg, #fb923c, #ea580c)",
            boxShadow: "0 4px 12px rgba(249,115,22,0.25), inset 0 1px 0 rgba(255,255,255,0.3)"
          }}
        >
          <span className="text-white text-xs font-bold">AI</span>
        </motion.div>
        <span className="text-sm font-medium">Ваши пожелания по работе?</span>
      </div>

      <div className="space-y-2 min-h-36">
        <AnimatePresence mode="popLayout">
          {chatMessages.slice(0, visibleMessages).map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className={`px-3 py-2 rounded-xl text-sm ${
                msg.type === "bot"
                  ? "bg-gray-100 text-gray-700 mr-8 shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)]"
                  : "bg-orange-50 text-orange-700 ml-8 border border-orange-100 shadow-[0_2px_8px_rgba(249,115,22,0.08),inset_0_1px_0_rgba(255,255,255,0.6)]"
              }`}
            >
              {msg.text}
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {showTyping && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className={`px-3 py-2.5 rounded-xl ${
                typingType === "bot"
                  ? "bg-gray-100 mr-8 shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)]"
                  : "bg-orange-50 ml-8 border border-orange-100 shadow-[0_2px_8px_rgba(249,115,22,0.08),inset_0_1px_0_rgba(255,255,255,0.6)]"
              }`}
            >
              <TypingDots />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-3 pt-3 border-t border-orange-100/50">
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="flex items-center gap-2 px-3 py-2 rounded-full text-sm text-gray-400 shadow-[inset_0_1px_3px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.8)]"
          style={{ background: "linear-gradient(180deg, #fafafa, #f5f5f5)" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>Поиск работы...</span>
        </motion.div>
      </div>
    </div>
  );
}

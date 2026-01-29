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
    <div
      className="relative rounded-3xl p-5 w-64 overflow-hidden"
      style={{
        background: "linear-gradient(145deg, #ffffff, #f8f8f8)",
        boxShadow: "0 20px 45px rgba(249,115,22,0.15), 0 8px 18px rgba(0,0,0,0.06), inset 0 2px 0 rgba(255,255,255,0.95), inset 0 -1px 4px rgba(249,115,22,0.04)",
      }}
    >
      {/* Gradient Border */}
      <div
        className="absolute inset-0 rounded-3xl pointer-events-none"
        style={{
          padding: "1px",
          background: "linear-gradient(135deg, rgba(249,115,22,0.15), rgba(255,255,255,0.4), rgba(249,115,22,0.15))",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />

      {/* Ambient Glow */}
      <div
        className="absolute inset-0 rounded-3xl blur-2xl -z-10"
        style={{
          background: "radial-gradient(circle at 50% 20%, rgba(249,115,22,0.25), transparent 60%)",
        }}
      />

      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-orange-100/50">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="w-9 h-9 rounded-full flex items-center justify-center relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #fb923c, #ea580c)",
            boxShadow: "0 6px 16px rgba(249,115,22,0.35), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 4px rgba(0,0,0,0.1)"
          }}
        >
          <motion.div
            className="absolute inset-0"
            animate={{
              x: ["-100%", "200%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 2,
            }}
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
            }}
          />
          <span className="text-white text-xs font-bold relative z-10">AI</span>
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
                  ? "text-gray-700 mr-8"
                  : "text-orange-700 ml-8"
              }`}
              style={{
                background: msg.type === "bot"
                  ? "linear-gradient(145deg, #f3f4f6, #e5e7eb)"
                  : "linear-gradient(145deg, #fff7ed, #ffedd5)",
                boxShadow: msg.type === "bot"
                  ? "0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)"
                  : "0 2px 8px rgba(249,115,22,0.1), inset 0 1px 0 rgba(255,255,255,0.8)",
                border: msg.type === "user" ? "1px solid rgba(249,115,22,0.15)" : "none",
              }}
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
                typingType === "bot" ? "mr-8" : "ml-8"
              }`}
              style={{
                background: typingType === "bot"
                  ? "linear-gradient(145deg, #f3f4f6, #e5e7eb)"
                  : "linear-gradient(145deg, #fff7ed, #ffedd5)",
                boxShadow: typingType === "bot"
                  ? "0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)"
                  : "0 2px 8px rgba(249,115,22,0.1), inset 0 1px 0 rgba(255,255,255,0.8)",
              }}
            >
              <TypingDots />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-3 pt-3 border-t border-orange-100/50">
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="flex items-center gap-2 px-3 py-2.5 rounded-full text-sm text-gray-400"
          style={{
            background: "linear-gradient(145deg, #fafafa, #f0f0f0)",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.8)"
          }}
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

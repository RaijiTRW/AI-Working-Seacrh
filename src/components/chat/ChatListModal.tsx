"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface Chat {
  id: string;
  title: string;
  updated_at: string;
}

interface ChatListModalProps {
  isOpen: boolean;
  onClose: () => void;
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  loading?: boolean;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return "Сегодня";
  } else if (days === 1) {
    return "Вчера";
  } else if (days < 7) {
    return `${days} дн. назад`;
  } else {
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  }
}

export default function ChatListModal({
  isOpen,
  onClose,
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  loading,
}: ChatListModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          ref={modalRef}
          className="absolute bottom-full left-0 mb-3 w-80 bg-[#1f2833]/95 backdrop-blur-xl rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] border border-[#ff6b00]/20 overflow-hidden z-50 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#c5c6c7]/10 bg-[#0b0c10]/50 shrink-0">
            <div>
              <h3 className="font-bold text-white text-sm">История сессий</h3>
              <p className="text-[10px] text-[#c5c6c7]/50 uppercase tracking-widest font-medium mt-0.5">JobAISearch</p>
            </div>
            <button
              onClick={onNewChat}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-widest font-black text-[#00f0ff] bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 hover:shadow-[0_0_10px_rgba(0,240,255,0.2)] rounded-lg transition-all border border-[#00f0ff]/30"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Новый
            </button>
          </div>

          {/* Chat list */}
          <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#0b0c10] scrollbar-track-transparent">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="relative w-8 h-8">
                  <div className="absolute inset-0 border-2 border-[#ff6b00]/20 rounded-full" />
                  <div className="absolute inset-0 border-2 border-[#ff6b00] border-t-transparent rounded-full animate-spin shadow-[0_0_10px_rgba(255,107,0,0.5)]" />
                </div>
              </div>
            ) : chats.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center">
                <svg className="w-8 h-8 text-[#c5c6c7]/20 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-[#c5c6c7]/40 text-xs font-medium">Нет активных сессий</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    className="relative group block"
                  >
                    <button
                      onClick={() => {
                        onSelectChat(chat.id);
                        onClose();
                      }}
                      className={`w-full flex items-center px-3 py-2.5 rounded-xl transition-all border ${currentChatId === chat.id
                          ? "bg-[#ff6b00]/10 border-[#ff6b00]/30 shadow-inner"
                          : "bg-transparent border-transparent hover:bg-[#0b0c10]/50 hover:border-[#c5c6c7]/10"
                        }`}
                    >
                      <div className="flex items-start gap-3 w-full pr-8">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${currentChatId === chat.id
                            ? "bg-gradient-to-br from-[#ff6b00] to-[#ff8c00] text-[#0b0c10] shadow-[0_0_10px_rgba(255,107,0,0.4)]"
                            : "bg-[#0b0c10]/80 text-[#c5c6c7]/40 border border-[#c5c6c7]/10"
                          }`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={currentChatId === chat.id ? 2.5 : 1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0 text-left pt-0.5">
                          <p
                            className={`text-[13px] font-medium whitespace-nowrap overflow-hidden max-w-[170px] ${currentChatId === chat.id ? "text-white font-bold" : "text-[#c5c6c7]/80 group-hover:text-white"
                              }`}
                            style={{
                              maskImage: "linear-gradient(to right, black 80%, transparent 100%)",
                              WebkitMaskImage: "linear-gradient(to right, black 80%, transparent 100%)",
                            }}
                          >
                            {chat.title}
                          </p>
                          <p className={`text-[10px] mt-0.5 font-medium ${currentChatId === chat.id ? "text-[#ff6b00]" : "text-[#c5c6c7]/40 group-hover:text-[#c5c6c7]/60"}`}>
                            {formatDate(chat.updated_at)}
                          </p>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(chat.id);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#c5c6c7]/30 hover:text-red-500 hover:bg-red-500/10 hover:shadow-[0_0_10px_rgba(239,68,68,0.2)] rounded-lg opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-red-500/30"
                      title="Удалить сессию"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

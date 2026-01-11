"use client";

import { useEffect, useRef } from "react";

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

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      className="absolute bottom-full left-0 mb-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Чаты</h3>
        <button
          onClick={onNewChat}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Новый
        </button>
      </div>

      {/* Chat list */}
      <div className="max-h-64 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" />
          </div>
        ) : chats.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-sm">
            Нет чатов
          </div>
        ) : (
          <div className="py-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`group flex items-center px-4 py-3 hover:bg-gray-50 transition-colors ${
                  currentChatId === chat.id ? "bg-orange-50" : ""
                }`}
              >
                <button
                  onClick={() => {
                    onSelectChat(chat.id);
                    onClose();
                  }}
                  className="flex-1 text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                      currentChatId === chat.id ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500"
                    }`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium whitespace-nowrap overflow-hidden max-w-[140px] ${
                          currentChatId === chat.id ? "text-orange-600" : "text-gray-900"
                        }`}
                        style={{
                          maskImage: "linear-gradient(to right, black 70%, transparent 100%)",
                          WebkitMaskImage: "linear-gradient(to right, black 70%, transparent 100%)",
                        }}
                      >
                        {chat.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
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
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  title="Удалить чат"
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
    </div>
  );
}

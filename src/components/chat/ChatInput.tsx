"use client";

import { useState, useRef, useEffect } from "react";
import ChatListModal, { Chat } from "./ChatListModal";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  centered?: boolean;
  chats?: Chat[];
  currentChatId?: string | null;
  onSelectChat?: (chatId: string) => void;
  onNewChat?: () => void;
  onDeleteChat?: (chatId: string) => void;
  loadingChats?: boolean;
}

export default function ChatInput({
  onSend,
  disabled = false,
  centered = false,
  chats = [],
  currentChatId = null,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  loadingChats = false,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [showChatList, setShowChatList] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = () => {
    if (!message.trim() || disabled) return;
    onSend(message.trim());
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasChats = chats.length > 0 || currentChatId;

  return (
    <div
      className={`w-full max-w-3xl mx-auto transition-all duration-700 ease-out px-6 ${
        centered ? "" : "pb-6"
      }`}
    >
      {/* Welcome text with fade animation */}
      <div
        className={`text-center mb-8 transition-all duration-500 ease-out ${
          centered
            ? "opacity-100 transform translate-y-0"
            : "opacity-0 transform -translate-y-6 pointer-events-none h-0 mb-0 overflow-hidden"
        }`}
      >
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Чем могу помочь?
        </h1>
        <p className="text-gray-500">
          Расскажи, какую работу ищешь
        </p>
      </div>

      <div className="relative bg-white rounded-3xl shadow-lg border border-gray-200">
        <div className="flex items-end gap-2 p-2">
          {/* Chat list button */}
          <div className="relative">
            <button
              onClick={() => setShowChatList(!showChatList)}
              disabled={!hasChats && centered}
              className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                hasChats || !centered
                  ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  : "bg-gray-50 text-gray-300 cursor-not-allowed"
              }`}
              title="Список чатов"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>

            <ChatListModal
              isOpen={showChatList}
              onClose={() => setShowChatList(false)}
              chats={chats}
              currentChatId={currentChatId}
              onSelectChat={onSelectChat || (() => {})}
              onNewChat={() => {
                onNewChat?.();
                setShowChatList(false);
              }}
              onDeleteChat={onDeleteChat || (() => {})}
              loading={loadingChats}
            />
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Напиши сообщение..."
            disabled={disabled}
            rows={1}
            className="flex-1 resize-none bg-transparent px-2 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none max-h-[200px]"
          />

          {/* Send button */}
          <button
            onClick={handleSubmit}
            disabled={!message.trim() || disabled}
            className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              message.trim() && !disabled
                ? "bg-orange-500 text-white hover:bg-orange-600"
                : "bg-gray-100 text-gray-300 cursor-not-allowed"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Disclaimer with fade animation */}
      <p
        className={`text-center text-xs text-gray-400 mt-4 transition-all duration-500 ease-out ${
          centered
            ? "opacity-100"
            : "opacity-0 h-0 mt-0 overflow-hidden"
        }`}
      >
        ИИ может ошибаться. Проверяйте важную информацию.
      </p>
    </div>
  );
}

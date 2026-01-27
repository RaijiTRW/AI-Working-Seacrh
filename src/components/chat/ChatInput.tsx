"use client";

import { useState, useRef, useEffect } from "react";
import ChatListModal, { Chat } from "./ChatListModal";

export interface SearchMode {
  searchInFeed: boolean;  // Поиск в ленте (БД)
  searchOnline: boolean;  // Поиск в сети (live)
}

interface ChatInputProps {
  onSend: (message: string, searchMode: SearchMode) => void;
  onStop?: () => void;
  disabled?: boolean;
  isTyping?: boolean;
  centered?: boolean;
  chats?: Chat[];
  currentChatId?: string | null;
  onSelectChat?: (chatId: string) => void;
  onNewChat?: () => void;
  onDeleteChat?: (chatId: string) => void;
  loadingChats?: boolean;
  canSearchOnline?: boolean; // false для Base плана
}

export default function ChatInput({
  onSend,
  onStop,
  disabled = false,
  isTyping = false,
  centered = false,
  chats = [],
  currentChatId = null,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  loadingChats = false,
  canSearchOnline = true,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [showChatList, setShowChatList] = useState(false);
  const [searchInFeed, setSearchInFeed] = useState(true);
  const [searchOnline, setSearchOnline] = useState(canSearchOnline);
  const [showSearchHelp, setShowSearchHelp] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Сбрасываем searchOnline если canSearchOnline изменился
  useEffect(() => {
    if (!canSearchOnline && searchOnline) {
      setSearchOnline(false);
    }
  }, [canSearchOnline, searchOnline]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = () => {
    if (!message.trim() || disabled) return;
    onSend(message.trim(), { searchInFeed, searchOnline });
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
      className={`w-full max-w-3xl mx-auto transition-all duration-700 ease-out px-6 ${centered ? "" : "pb-6"
        }`}
    >
      {/* Welcome text with fade animation */}
      <div
        className={`text-center mb-8 transition-all duration-500 ease-out ${centered
            ? "opacity-100 transform translate-y-0"
            : "opacity-0 transform -translate-y-6 pointer-events-none h-0 mb-0 overflow-hidden"
          }`}
      >
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Что ищем сегодня?
        </h1>
        <p className="text-gray-500">
          Расскажи, какую работу ищешь
        </p>
      </div>

      <div className="relative bg-white rounded-3xl shadow-lg border border-gray-200">
        {/* Search Mode Toggles */}
        <div className="flex items-center gap-3 px-4 pt-3 pb-1 border-b border-gray-100">
          <span className="text-xs text-gray-400">Искать:</span>

          {/* В ленте */}
          <button
            onClick={() => {
              // Нельзя отключить оба
              if (searchInFeed && !searchOnline) return;
              setSearchInFeed(!searchInFeed);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all ${
              searchInFeed
                ? "bg-orange-100 text-orange-600 border border-orange-200"
                : "bg-gray-50 text-gray-400 border border-gray-200 hover:bg-gray-100"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            В ленте
          </button>

          {/* В сети */}
          <div className="relative group">
            <button
              onClick={() => {
                if (!canSearchOnline) return; // Недоступно для Base
                // Нельзя отключить оба
                if (searchOnline && !searchInFeed) return;
                setSearchOnline(!searchOnline);
              }}
              disabled={!canSearchOnline}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all ${
                !canSearchOnline
                  ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60"
                  : searchOnline
                  ? "bg-blue-100 text-blue-600 border border-blue-200"
                  : "bg-gray-50 text-gray-400 border border-gray-200 hover:bg-gray-100"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              В сети
              {!canSearchOnline && (
                <svg className="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
            </button>
            {/* Tooltip для Base плана */}
            {!canSearchOnline && (
              <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50">
                Доступно в Pro подписке
              </div>
            )}
          </div>

          {/* Help button */}
          <div className="relative ml-auto">
            <button
              onClick={() => setShowSearchHelp(!showSearchHelp)}
              className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 flex items-center justify-center text-xs"
            >
              ?
            </button>

            {/* Help tooltip - открывается вверх когда инпут внизу */}
            {showSearchHelp && (
              <div className={`absolute right-0 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-50 ${centered ? "top-7" : "bottom-full mb-2"}`}>
                <div className="text-xs space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded bg-orange-100 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-gray-700">В ленте</span>
                      <p className="text-gray-500">Быстрый поиск среди сохранённых вакансий в нашей базе</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded bg-blue-100 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-gray-700">В сети</span>
                      <p className="text-gray-500">Парсинг свежих вакансий с hh.ru, SuperJob</p>
                      {!canSearchOnline && (
                        <p className="text-orange-500 mt-1">Требуется Pro подписка</p>
                      )}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-100 text-gray-400">
                    {canSearchOnline
                      ? "Включите оба для максимального охвата"
                      : "Base план: только поиск в ленте"}
                  </div>
                </div>
                <button
                  onClick={() => setShowSearchHelp(false)}
                  className="absolute top-1 right-1 text-gray-300 hover:text-gray-500"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-end gap-2 p-2">
          {/* Chat list button */}
          <div className="relative">
            <button
              onClick={() => setShowChatList(!showChatList)}
              disabled={!hasChats && centered}
              className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${hasChats || !centered
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
              onSelectChat={onSelectChat || (() => { })}
              onNewChat={() => {
                onNewChat?.();
                setShowChatList(false);
              }}
              onDeleteChat={onDeleteChat || (() => { })}
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

          {/* Send/Stop button */}
          {isTyping ? (
            <button
              onClick={onStop}
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-red-500 text-white hover:bg-red-600"
              title="Остановить"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!message.trim() || disabled}
              className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${message.trim() && !disabled
                  ? "bg-orange-500 text-white hover:bg-orange-600"
                  : "bg-gray-100 text-gray-300 cursor-not-allowed"
                }`}
              title="Отправить"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Disclaimer with fade animation */}
      <p
        className={`text-center text-xs text-gray-400 mt-4 transition-all duration-500 ease-out ${centered
            ? "opacity-100"
            : "opacity-0 h-0 mt-0 overflow-hidden"
          }`}
      >
        ИИ может ошибаться. Проверяйте важную информацию.
      </p>
    </div>
  );
}

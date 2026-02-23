"use client";

import { useState, useRef, useEffect } from "react";
import ChatListModal, { Chat } from "./ChatListModal";

export interface SearchMode {
  searchInFeed: boolean;  // Поиск в ленте (БД)
  searchOnline: boolean;  // Поиск в сети (live)
}

export interface LifestylePreferences {
  full_remote_only: boolean;
  no_mandatory_calls: boolean;
  async_first: boolean;
  flexible_hours: boolean;
  strict_mode: boolean;
}

interface ChatInputProps {
  onSend: (message: string, searchMode: SearchMode, lifestylePreferences: LifestylePreferences) => void;
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
  const [showLifestyleFilters, setShowLifestyleFilters] = useState(false);
  const [lifestylePanelPlacement, setLifestylePanelPlacement] = useState<"top" | "bottom">("top");
  const [lifestylePreferences, setLifestylePreferences] = useState<LifestylePreferences>({
    full_remote_only: false,
    no_mandatory_calls: false,
    async_first: false,
    flexible_hours: false,
    strict_mode: false,
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lifestylePanelRef = useRef<HTMLDivElement>(null);
  const lifestyleButtonRef = useRef<HTMLButtonElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!lifestylePanelRef.current) return;
      if (!lifestylePanelRef.current.contains(event.target as Node)) {
        setShowLifestyleFilters(false);
      }
    };

    if (showLifestyleFilters) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLifestyleFilters]);

  useEffect(() => {
    if (!showLifestyleFilters) return;

    const updateLifestylePanelPlacement = () => {
      const button = lifestyleButtonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceAbove = rect.top - 12;
      const spaceBelow = viewportHeight - rect.bottom - 12;
      const estimatedPanelHeight = 420;

      if (spaceBelow < estimatedPanelHeight && spaceAbove > spaceBelow) {
        setLifestylePanelPlacement("top");
      } else {
        setLifestylePanelPlacement("bottom");
      }
    };

    updateLifestylePanelPlacement();
    window.addEventListener("resize", updateLifestylePanelPlacement);
    window.addEventListener("scroll", updateLifestylePanelPlacement, true);

    return () => {
      window.removeEventListener("resize", updateLifestylePanelPlacement);
      window.removeEventListener("scroll", updateLifestylePanelPlacement, true);
    };
  }, [showLifestyleFilters]);

  const handleSubmit = () => {
    if (!message.trim() || disabled) return;
    onSend(message.trim(), { searchInFeed, searchOnline }, lifestylePreferences);
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasChats = chats.length > 0 || currentChatId;
  const activeLifestyleCount = Object.entries(lifestylePreferences).filter(
    ([key, value]) => key !== "strict_mode" && value
  ).length;
  const hasAnyLifestyleFilters = activeLifestyleCount > 0;
  const lifestyleSummary = [
    lifestylePreferences.full_remote_only && "Удалёнка",
    lifestylePreferences.no_mandatory_calls && "Без созвонов",
    lifestylePreferences.async_first && "Асинхрон",
    lifestylePreferences.flexible_hours && "Гибкий график",
  ].filter(Boolean) as string[];
  const toggleLifestylePreference = (key: keyof LifestylePreferences) => {
    setLifestylePreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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
        <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
          Что ищем сегодня?
        </h1>
        <p className="text-[#c5c6c7]/80">
          Опиши свой опыт и идеальную позицию для ИИ...
        </p>
      </div>

      <div className="relative bg-[#1f2833]/60 backdrop-blur-xl rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-[#c5c6c7]/10">
        {/* Search Mode Toggles */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-2 border-b border-[#c5c6c7]/5">
          <span className="text-xs text-[#c5c6c7]/50 font-medium uppercase tracking-wider">Где искать:</span>

          {/* В ленте */}
          <button
            onClick={() => {
              // Нельзя отключить оба
              if (searchInFeed && !searchOnline) return;
              setSearchInFeed(!searchInFeed);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${searchInFeed
                ? "bg-[#ff6b00]/20 text-[#ff6b00] border border-[#ff6b00]/40 shadow-[0_0_10px_rgba(255,107,0,0.2)]"
                : "bg-[#0b0c10]/50 text-[#c5c6c7]/60 border border-[#c5c6c7]/10 hover:bg-[#0b0c10]"
              }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Платформа
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${!canSearchOnline
                  ? "bg-[#0b0c10]/30 text-[#c5c6c7]/40 border border-[#c5c6c7]/5 cursor-not-allowed"
                  : searchOnline
                    ? "bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                    : "bg-[#0b0c10]/50 text-[#c5c6c7]/60 border border-[#c5c6c7]/10 hover:bg-[#0b0c10]"
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
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] backdrop-blur-md text-xs font-medium rounded-md px-3 py-1.5 whitespace-nowrap z-50 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                Доступно в Pro подписке
              </div>
            )}
          </div>

          {/* Help button */}
          <div className="relative ml-auto">
            <button
              onClick={() => setShowSearchHelp(!showSearchHelp)}
              className="w-6 h-6 rounded-full bg-[#0b0c10]/50 border border-[#c5c6c7]/10 text-[#c5c6c7]/60 hover:text-white hover:border-[#c5c6c7]/30 flex items-center justify-center text-xs font-bold transition-colors"
            >
              ?
            </button>

            {/* Help tooltip - открывается вверх когда инпут внизу */}
            {showSearchHelp && (
              <div className={`absolute right-0 w-72 bg-[#1f2833]/90 backdrop-blur-xl rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] border border-[#c5c6c7]/10 p-4 z-50 ${centered ? "top-9" : "bottom-full mb-3"}`}>
                <div className="text-sm space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded bg-[#ff6b00]/20 border border-[#ff6b00]/30 shadow-[0_0_10px_rgba(255,107,0,0.2)] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block mb-0.5">Платформа</span>
                      <p className="text-[#c5c6c7]/80 text-xs">Быстрый поиск среди сохранённых вакансий в нашей AI-базе</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded bg-[#00f0ff]/20 border border-[#00f0ff]/30 shadow-[0_0_10px_rgba(0,240,255,0.2)] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block mb-0.5">В сети</span>
                      <p className="text-[#c5c6c7]/80 text-xs">Live-парсинг свежих вакансий с hh.ru, SuperJob, Хабр Карьера</p>
                      {!canSearchOnline && (
                        <p className="text-[#00f0ff] text-xs font-bold mt-1 inline-flex items-center gap-1">
                          Требуется Pro подписка
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="pt-3 border-t border-[#c5c6c7]/10 text-[#c5c6c7]/60 text-xs">
                    {canSearchOnline
                      ? "Включите оба тумблера для максимального охвата"
                      : "Base план ограничен локальным поиском"}
                  </div>
                </div>
                <button
                  onClick={() => setShowSearchHelp(false)}
                  className="absolute top-2 right-2 text-[#c5c6c7]/50 hover:text-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-end gap-2 p-3">
          {/* Chat list button */}
          <div className="relative">
            <button
              onClick={() => setShowChatList(!showChatList)}
              disabled={!hasChats && centered}
              className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all border ${hasChats || !centered
                ? "bg-[#0b0c10]/50 text-[#c5c6c7] border-[#c5c6c7]/10 hover:bg-[#0b0c10] hover:text-white"
                : "bg-transparent text-[#c5c6c7]/20 border-transparent cursor-not-allowed"
                }`}
              title="Список чатов"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          {/* Lifestyle filters button */}
          <div className="relative" ref={lifestylePanelRef}>
            <button
              type="button"
              ref={lifestyleButtonRef}
              onClick={() => setShowLifestyleFilters((prev) => !prev)}
              className={`relative flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all border ${hasAnyLifestyleFilters || showLifestyleFilters
                  ? "bg-[#ff6b00]/10 text-[#ff6b00] border-[#ff6b00]/30 shadow-inner"
                  : "bg-[#0b0c10]/50 text-[#c5c6c7] border-[#c5c6c7]/10 hover:bg-[#0b0c10] hover:text-white"
                }`}
              title="Нейро-фильтры формата работы"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M10 18h4" />
              </svg>
              {activeLifestyleCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 rounded-full bg-[#ff6b00] text-white text-[11px] leading-5 font-bold shadow-[0_0_10px_rgba(255,107,0,0.6)] text-center">
                  {activeLifestyleCount}
                </span>
              )}
            </button>

            {showLifestyleFilters && (
              <div
                className={`absolute z-50 w-80 bg-[#1f2833]/95 backdrop-blur-xl rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] border border-[#ff6b00]/20 p-4 max-h-[min(75vh,34rem)] overflow-y-auto ${lifestylePanelPlacement === "bottom" ? "top-14 left-0" : "bottom-full mb-3 left-0"
                  }`}
              >
                <div className="flex items-start justify-between mb-4 border-b border-[#c5c6c7]/10 pb-3">
                  <div>
                    <p className="text-sm font-bold text-white mb-0.5">Критерии комфорта</p>
                    <p className="text-[11px] text-[#c5c6c7]/70 font-medium">ИИ проанализирует текст вакансии</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setLifestylePreferences({
                        full_remote_only: false,
                        no_mandatory_calls: false,
                        async_first: false,
                        flexible_hours: false,
                        strict_mode: false,
                      })
                    }
                    className="text-xs text-[#00f0ff] hover:text-white font-semibold transition-colors mt-0.5"
                  >
                    Сброс
                  </button>
                </div>

                <div className="space-y-1.5">
                  {[
                    { key: "full_remote_only" as const, label: "Только полная удалёнка", hint: "Блокировать офис и гибрид" },
                    { key: "no_mandatory_calls" as const, label: "Без обязательных созвонов", hint: "Отсеивать daily/митинги" },
                    { key: "async_first" as const, label: "Асинхронный формат", hint: "Искать async-first сигналы" },
                    { key: "flexible_hours" as const, label: "Гибкий график", hint: "Блокировать жёсткий 5/2" },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#0b0c10]/50 transition-colors cursor-pointer border border-transparent hover:border-[#c5c6c7]/10"
                    >
                      <input
                        type="checkbox"
                        checked={lifestylePreferences[item.key]}
                        onChange={() => toggleLifestylePreference(item.key)}
                        className="mt-0.5 w-4 h-4 text-[#ff6b00] rounded focus:ring-0 focus:ring-offset-0 bg-[#0b0c10] border-[#c5c6c7]/20"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-white">{item.label}</span>
                        <span className="block text-[11px] text-[#c5c6c7]/60 mt-0.5">{item.hint}</span>
                      </span>
                    </label>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-[#c5c6c7]/10">
                  <label className="flex items-start gap-3 p-3 rounded-xl bg-[#ff6b00]/5 border border-[#ff6b00]/10 hover:bg-[#ff6b00]/10 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lifestylePreferences.strict_mode}
                      onChange={() => toggleLifestylePreference("strict_mode")}
                      className="mt-0.5 w-4 h-4 text-[#ff6b00] rounded focus:ring-0 focus:ring-offset-0 bg-[#0b0c10] border-[#ff6b00]/30"
                    />
                    <span>
                      <span className="block text-sm font-bold text-white">Жёсткий отбор</span>
                      <span className="block text-[11px] text-[#c5c6c7]/70 mt-0.5">Показывать исключительно совпадения 100%</span>
                    </span>
                  </label>
                </div>

                {lifestyleSummary.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {lifestyleSummary.map((label) => (
                      <span key={label} className="text-[10px] uppercase font-bold px-2.5 py-1 rounded border border-[#ff6b00]/30 bg-[#ff6b00]/10 text-[#ff6b00]">
                        {label}
                      </span>
                    ))}
                    {lifestylePreferences.strict_mode && (
                      <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded border border-[#00f0ff]/30 bg-[#00f0ff]/10 text-[#00f0ff]">
                        Strict
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Я Senior Frontend (React, Node)..."
            disabled={disabled}
            rows={1}
            className="flex-1 resize-none bg-transparent px-3 py-3 text-white placeholder-[#c5c6c7]/30 text-base focus:outline-none max-h-[200px]"
          />

          {/* Send/Stop button */}
          {isTyping ? (
            <button
              onClick={onStop}
              className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all bg-[#0b0c10] border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white shadow-[0_0_15px_rgba(239,68,68,0.2)]"
              title="Остановить"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!message.trim() || disabled}
              className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${message.trim() && !disabled
                ? "bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] text-white shadow-[0_0_20px_rgba(255,107,0,0.4)] hover:shadow-[0_0_30px_rgba(255,107,0,0.6)] hover:scale-105"
                : "bg-[#0b0c10]/50 text-[#c5c6c7]/30 border border-[#c5c6c7]/10 cursor-not-allowed"
                }`}
              title="Запустить поиск"
            >
              <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Disclaimer with fade animation */}
      <p
        className={`text-center text-[11px] text-[#c5c6c7]/40 uppercase tracking-widest font-semibold mt-6 transition-all duration-500 ease-out ${centered
          ? "opacity-100"
          : "opacity-0 h-0 mt-0 overflow-hidden"
          }`}
      >
        Нейросеть агрегирует данные. Возможны неточности парсинга.
      </p>
    </div>
  );
}

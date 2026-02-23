"use client";

import { useEffect, useState, useRef } from "react";
import VacancyCards, { Vacancy } from "./VacancyCards";
import VacancyFeedPreview from "./VacancyFeedPreview";

export type SearchPhase = 'idle' | 'starting' | 'searching' | 'firstVacancyFound' | 'completed';

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  vacancies?: Vacancy[];
  rejectedVacancies?: Vacancy[];
}

interface ChatMessagesProps {
  messages: Message[];
  isTyping?: boolean;
  streamingText?: string;
  streamingVacancies?: Vacancy[];
  streamingRejectedVacancies?: Vacancy[];
  onLoadMore?: (messageId: string) => void;
  searchPhase?: SearchPhase;
  showStartingText?: boolean;
  isDrawerOpen?: boolean;
  onToggleDrawer?: () => void;
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 h-6">
      <span className="w-2 h-2 bg-[#ff6b00] rounded-full animate-bounce shadow-[0_0_8px_rgba(255,107,0,0.8)]" style={{ animationDelay: "0ms" }} />
      <span className="w-2 h-2 bg-[#00f0ff] rounded-full animate-bounce shadow-[0_0_8px_rgba(0,240,255,0.8)]" style={{ animationDelay: "150ms" }} />
      <span className="w-2 h-2 bg-[#a200ff] rounded-full animate-bounce shadow-[0_0_8px_rgba(162,0,255,0.8)]" style={{ animationDelay: "300ms" }} />
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg hover:bg-[#1f2833] transition-colors opacity-0 group-hover:opacity-100 border border-transparent hover:border-[#c5c6c7]/20"
      title={copied ? "Скопировано!" : "Копировать текст"}
    >
      {copied ? (
        <svg className="w-4 h-4 text-[#00ff88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-[#c5c6c7]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

function AssistantMessage({
  content,
  vacancies,
  rejectedVacancies,
  animate,
  onLoadMore,
  messageId,
  onToggleDrawer,
}: {
  content: string;
  vacancies?: Vacancy[];
  rejectedVacancies?: Vacancy[];
  animate?: boolean;
  onLoadMore?: (messageId: string) => void;
  messageId?: string;
  onToggleDrawer?: () => void;
}) {
  const [displayedText, setDisplayedText] = useState(animate ? "" : content);
  const [isComplete, setIsComplete] = useState(!animate);
  const [showVacancies, setShowVacancies] = useState(!animate);
  const canLoadMore = Boolean(vacancies && vacancies.length > 0 && onLoadMore && messageId && !animate);
  const canOpenDrawer = Boolean(vacancies && vacancies.length > 0 && onToggleDrawer && !animate);

  useEffect(() => {
    if (!animate) {
      setDisplayedText(content);
      setIsComplete(true);
      setShowVacancies(true);
      return;
    }

    let index = 0;
    const interval = setInterval(() => {
      if (index < content.length) {
        setDisplayedText(content.slice(0, index + 1));
        index++;
      } else {
        setIsComplete(true);
        clearInterval(interval);
        // Показываем вакансии после текста
        setTimeout(() => setShowVacancies(true), 300);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [content, animate]);

  return (
    <div className={`group transition-all duration-300 ${onToggleDrawer ? 'max-w-5xl lg:max-w-3xl' : 'max-w-5xl'}`}>
      <div className="flex gap-4">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b00] to-[#ff8c00] flex items-center justify-center shadow-[0_0_15px_rgba(255,107,0,0.3)] relative">
          <div className="absolute inset-0 rounded-xl border border-white/20" />
          <span className="text-white text-sm font-black tracking-wider">AI</span>
        </div>
        <div className="flex-1 pt-1.5">
          <div className="flex items-center gap-3 pb-3">
            <p className="font-bold text-[#ff6b00] tracking-wide uppercase text-xs">JobAISearch</p>
            {canLoadMore && (
              <>
                <button
                  onClick={() => onLoadMore(messageId)}
                  className="text-xs px-2.5 py-1 rounded-md bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff]/20 hover:shadow-[0_0_10px_rgba(0,240,255,0.4)] transition-all font-bold"
                  title="Найти еще вакансии по этому запросу"
                >
                  Глубже
                </button>
              </>
            )}
            {canOpenDrawer && (
              <>
                <button
                  onClick={onToggleDrawer}
                  className="p-1.5 rounded-lg border border-[#c5c6c7]/10 bg-[#1f2833]/50 hover:bg-[#1f2833] transition-colors"
                  title="Открыть ленту вакансий"
                >
                  <svg className="w-4 h-4 text-[#00f0ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </>
            )}
            {isComplete && <CopyButton text={content} />}
          </div>
          <p className="text-[#c5c6c7] leading-relaxed whitespace-pre-wrap font-light text-base md:text-[17px]">
            {displayedText}
            {!isComplete && <span className="inline-block w-1.5 h-5 bg-[#ff6b00] ml-1 shadow-[0_0_8px_rgba(255,107,0,0.8)] animate-pulse" />}
          </p>
        </div>
      </div>

      {/* Vacancy cards */}
      {showVacancies && vacancies && vacancies.length > 0 && (
        <div className="mt-6 ml-14 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <VacancyCards vacancies={vacancies} rejectedVacancies={rejectedVacancies} />
        </div>
      )}
    </div>
  );
}

function UserMessage({ content, isNew }: { content: string; isNew?: boolean }) {
  return (
    <div className={`flex gap-4 max-w-3xl ml-auto ${isNew ? 'animate-user-message' : ''}`}>
      <div className="flex-1 pt-1.5 text-right flex justify-end">
        <div className="inline-flex items-start gap-2 group justify-end">
          <div className="mt-2">
            <CopyButton text={content} />
          </div>
          <div className="bg-[#1f2833]/80 border border-[#c5c6c7]/10 backdrop-blur-md rounded-2xl rounded-tr-sm px-5 py-3.5 text-left shadow-lg">
            <p className="text-white leading-relaxed whitespace-pre-wrap font-medium">{content}</p>
          </div>
        </div>
      </div>
      <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#1f2833] to-[#0b0c10] border border-[#c5c6c7]/20 flex items-center justify-center">
        <svg className="w-5 h-5 text-[#c5c6c7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
    </div>
  );
}

export default function ChatMessages({
  messages,
  isTyping,
  streamingText,
  streamingVacancies,
  streamingRejectedVacancies,
  onLoadMore,
  searchPhase = 'idle',
  showStartingText = false,
  onToggleDrawer,
}: ChatMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());
  const [historyMessageIds, setHistoryMessageIds] = useState<Set<string>>(new Set());
  const prevMessagesRef = useRef<Message[]>([]);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();

    // Прокрутка ещё раз после появления вакансий (задержка на анимацию)
    const timeout = setTimeout(scrollToBottom, 600);

    if (messages.length > 0) {
      setLastMessageId(messages[messages.length - 1].id);
    }

    const prevLength = prevMessagesRef.current.length;
    const currentLength = messages.length;

    // Detect if this is a history load (multiple messages appeared at once from 0)
    if (prevLength === 0 && currentLength > 1) {
      // History load - cascade animation
      const historyIds = new Set(messages.map(m => m.id));
      setHistoryMessageIds(historyIds);

      // Clear history status after all animations complete
      const totalDuration = currentLength * 60 + 500;
      setTimeout(() => {
        setHistoryMessageIds(new Set());
      }, totalDuration);
    }
    // Single new message (user sent or AI responded)
    else if (currentLength > prevLength && prevLength > 0) {
      const newMessages = messages.slice(prevLength);

      setNewMessageIds(prev => {
        const newIds = new Set(prev);
        newMessages.forEach(msg => newIds.add(msg.id));
        return newIds;
      });

      // Clear "new" status after animation completes
      setTimeout(() => {
        setNewMessageIds(prev => {
          const updated = new Set(prev);
          newMessages.forEach(msg => updated.delete(msg.id));
          return updated;
        });
      }, 600);
    }

    prevMessagesRef.current = messages;

    return () => clearTimeout(timeout);
  }, [messages, isTyping, streamingText]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-6 py-10 pt-16 pb-40 space-y-8"
    >
      {messages.map((msg, index) => {
        const isHistory = historyMessageIds.has(msg.id);
        const isNewUser = newMessageIds.has(msg.id) && msg.role === "user";

        return (
          <div
            key={msg.id}
            className={isHistory ? "animate-history-message" : ""}
            style={isHistory ? { animationDelay: `${index * 60}ms` } : undefined}
          >
            {msg.role === "user" ? (
              <UserMessage content={msg.content} isNew={isNewUser} />
            ) : (
              <AssistantMessage
                content={msg.content}
                vacancies={msg.vacancies}
                rejectedVacancies={msg.rejectedVacancies}
                animate={msg.id === lastMessageId && !isHistory && isTyping}
                onLoadMore={onLoadMore}
                messageId={msg.id}
                onToggleDrawer={onToggleDrawer}
              />
            )}
          </div>
        );
      })}

      {/* Streaming message */}
      {isTyping && (streamingText || (streamingVacancies?.length ?? 0) > 0) && (
        <div className="animate-in fade-in duration-300">
          <AssistantMessage
            content={streamingText || "Инициализация конвейера поиска..."}
            vacancies={streamingVacancies}
            rejectedVacancies={streamingRejectedVacancies}
            animate={false}
            onToggleDrawer={(streamingVacancies?.length ?? 0) > 0 ? onToggleDrawer : undefined}
          />
        </div>
      )}

      {/* Typing indicator (before text starts streaming) */}
      {isTyping && !streamingText && (streamingVacancies?.length ?? 0) === 0 && !showStartingText && searchPhase !== 'searching' && (
        <div className="flex gap-4 max-w-3xl animate-in fade-in duration-300 mt-4">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#1f2833] to-[#0b0c10] border border-[#c5c6c7]/10 flex items-center justify-center">
            <span className="text-[#00f0ff] text-xs font-black tracking-wider">AI</span>
          </div>
          <div className="flex-1 pt-2">
            <TypingDots />
          </div>
        </div>
      )}

      {/* Phase 1: "Начинаю поиск..." */}
      {showStartingText && isTyping && (
        <div className="flex gap-4 max-w-3xl animate-in fade-in duration-300">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#1f2833] to-[#0b0c10] border border-[#ff6b00]/30 shadow-[0_0_10px_rgba(255,107,0,0.2)] flex items-center justify-center">
            <span className="text-[#ff6b00] text-xs font-black tracking-wider">AI</span>
          </div>
          <div className="flex-1 pt-2.5">
            <p className="text-[#c5c6c7] font-medium tracking-wide">Подключение к узлам рекрутмента...</p>
          </div>
        </div>
      )}

      {/* Phase 2: Размытая лента с "Ищу вакансии..." */}
      {searchPhase === 'searching' && isTyping && (
        <div className="animate-in fade-in duration-300">
          <div className="flex gap-4 mb-5">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#1f2833] to-[#0b0c10] border border-[#00f0ff]/30 shadow-[0_0_10px_rgba(0,240,255,0.2)] flex items-center justify-center">
              <span className="text-[#00f0ff] text-xs font-black tracking-wider">AI</span>
            </div>
            <div className="flex-1 pt-2">
              <div className="flex items-center gap-3">
                <p className="font-bold text-[#00f0ff] tracking-wide uppercase text-xs">JobAISearch</p>
                {onToggleDrawer && (
                  <button
                    type="button"
                    onClick={onToggleDrawer}
                    className="p-1.5 rounded-lg border border-[#c5c6c7]/10 bg-[#1f2833]/50 hover:bg-[#1f2833] transition-colors shadow-sm"
                    title="Войти в интерфейс ленты"
                  >
                    <svg className="w-4 h-4 text-[#00f0ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
          <VacancyFeedPreview isBlurred={true} overlayText="Обработка потока данных..." />
        </div>
      )}
    </div>
  );
}

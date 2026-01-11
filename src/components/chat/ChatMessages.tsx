"use client";

import { useEffect, useState, useRef } from "react";
import VacancyCards, { Vacancy } from "./VacancyCards";

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
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  );
}

function AssistantMessage({
  content,
  vacancies,
  rejectedVacancies,
  animate,
}: {
  content: string;
  vacancies?: Vacancy[];
  rejectedVacancies?: Vacancy[];
  animate?: boolean;
}) {
  const [displayedText, setDisplayedText] = useState(animate ? "" : content);
  const [isComplete, setIsComplete] = useState(!animate);
  const [showVacancies, setShowVacancies] = useState(!animate);

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
    <div className="max-w-4xl">
      <div className="flex gap-3">
        <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">AI</span>
        </div>
        <div className="flex-1 pt-1">
          <p className="pb-4">Zend:</p>
          <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
            {displayedText}
            {!isComplete && <span className="inline-block w-0.5 h-5 bg-orange-500 ml-0.5 animate-pulse" />}
          </p>
        </div>
      </div>

      {/* Vacancy cards */}
      {showVacancies && vacancies && vacancies.length > 0 && (
        <div className="mt-4 ml-11 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <VacancyCards vacancies={vacancies} rejectedVacancies={rejectedVacancies} />
        </div>
      )}
    </div>
  );
}

function UserMessage({ content, isNew }: { content: string; isNew?: boolean }) {
  return (
    <div className={`flex gap-3 max-w-3xl ml-auto ${isNew ? 'animate-user-message' : ''}`}>
      <div className="flex-1 pt-1 text-right">
        <div className="inline-block bg-gray-100 rounded-2xl px-4 py-3 text-left">
          <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
      </div>
      <div className="shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
      className="flex-1 overflow-y-auto px-6 pt-8 pb-32 space-y-6"
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
                animate={msg.id === lastMessageId && messages[messages.length - 1].role === "assistant" && !isHistory}
              />
            )}
          </div>
        );
      })}

      {/* Streaming message */}
      {isTyping && streamingText && (
        <div className="animate-in fade-in duration-300">
          <AssistantMessage
            content={streamingText}
            vacancies={streamingVacancies}
            rejectedVacancies={streamingRejectedVacancies}
            animate={false}
          />
        </div>
      )}

      {/* Typing indicator (before text starts streaming) */}
      {isTyping && !streamingText && (
        <div className="flex gap-3 max-w-3xl animate-in fade-in duration-300">
          <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">AI</span>
          </div>
          <div className="flex-1 pt-2">
            <TypingDots />
          </div>
        </div>
      )}
    </div>
  );
}

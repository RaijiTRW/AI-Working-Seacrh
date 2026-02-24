"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Wand2, Loader2, Lock, Zap } from "lucide-react";
import { Resume } from "@/types/resume";
import { useRouter } from "next/navigation";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface MainSectionProps {
  userId?: string;
  onResumeGenerated: (resumeData: Partial<Resume>) => void;
  currentResume?: Resume;
}

export default function MainSection({
  userId,
  onResumeGenerated,
  currentResume
}: MainSectionProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [remainingGenerations, setRemainingGenerations] = useState<number | null>(null);
  const [checkingLimit, setCheckingLimit] = useState(false);

  const isAuthenticated = !!userId;

  // Проверяем лимит генераций при монтировании
  useEffect(() => {
    if (isAuthenticated) {
      fetchRemainingGenerations();
    }
  }, [isAuthenticated]);

  const fetchRemainingGenerations = async () => {
    if (!userId) return;

    setCheckingLimit(true);
    try {
      const response = await fetch(`/api/resume/ai-generate/limit?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setRemainingGenerations(data.remaining);
      }
    } catch (err) {
    } finally {
      setCheckingLimit(false);
    }
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    // Проверка авторизации
    if (!isAuthenticated) {
      setError("Необходимо войти в аккаунт для использования AI генератора");
      return;
    }

    // Проверка лимита
    if (remainingGenerations !== null && remainingGenerations <= 0) {
      setError("Исчерпан лимит генераций резюме (максимум 5)");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/resume/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMessage.content,
          user_id: userId,
          current_resume: currentResume,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 403) {
          throw new Error("AI функции доступны только на Pro подписке");
        }
        throw new Error(errorData.detail || "Ошибка генерации резюме");
      }

      const data = await response.json();

      // Add AI response message
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message || "Резюме успешно сгенерировано! Проверьте и отредактируйте поля при необходимости.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Update resume with generated data
      if (data.resume) {
        onResumeGenerated(data.resume);
      }

      // Обновляем лимит после успешной генерации
      if (remainingGenerations !== null) {
        setRemainingGenerations(remainingGenerations - 1);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Не удалось сгенерировать резюме";
      setError(errorMessage);

      // Add error message
      const errorMessageObj: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorMessage,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessageObj]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-[#1f2833]/50 backdrop-blur-md rounded-xl p-6 border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-[#ff6b00] to-[#ff8c00] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(255,107,0,0.4)]">
              <Zap className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
              AI-помощник для резюме
            </h2>
            <p className="text-gray-400 text-sm mb-3 font-light">
              Войдите в аккаунт, чтобы AI создал полноценное резюме на основе вашего описания.
              Профессиональные формулировки, оптимизация под ATS и готовность за минуты.
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-[#00f0ff]">
              <span className="bg-[#00f0ff]/10 border border-[#00f0ff]/20 px-2 py-1 rounded-full">
                ✓ Опыт работы с метриками
              </span>
              <span className="bg-[#00f0ff]/10 border border-[#00f0ff]/20 px-2 py-1 rounded-full">
                ✓ Ключевые навыки
              </span>
              <span className="bg-[#00f0ff]/10 border border-[#00f0ff]/20 px-2 py-1 rounded-full">
                ✓ ATS-оптимизация
              </span>
              <span className="bg-[#00f0ff]/10 border border-[#00f0ff]/20 px-2 py-1 rounded-full">
                ✓ Готовность за 2 минуты
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Gate - для неавторизованных пользователей */}
      {!isAuthenticated && (
        <div className="bg-[#1f2833]/40 backdrop-blur-md rounded-xl p-6 border border-white/10 text-center shadow-[0_0_20px_rgba(0,0,0,0.3)]">
          <div className="w-16 h-16 bg-[#ff6b00]/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#ff6b00]/30 shadow-[0_0_15px_rgba(255,107,0,0.2)]">
            <Lock className="w-8 h-8 text-[#ff6b00]" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Войдите, чтобы использовать AI
          </h3>
          <p className="text-gray-400 text-sm mb-4 font-light">
            Авторизованные пользователи получают 5 бесплатных генераций резюме
          </p>
          <div className="flex gap-3 justify-center mb-4">
            <button
              onClick={() => router.push("/auth")}
              className="px-6 py-2 bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] text-white rounded-lg font-bold hover:shadow-[0_0_15px_rgba(255,107,0,0.5)] transition-all"
            >
              Войти в аккаунт
            </button>
            <button
              onClick={() => router.push("/auth?mode=signup")}
              className="px-6 py-2 bg-transparent border border-white/20 text-gray-300 rounded-lg font-bold hover:border-white/40 hover:text-white hover:bg-white/5 transition-all"
            >
              Создать аккаунт
            </button>
          </div>
        </div>
      )}

      {/* Limit Indicator */}
      {isAuthenticated && !checkingLimit && remainingGenerations !== null && (
        <div className={`rounded-lg p-4 border backdrop-blur-md ${remainingGenerations <= 0
            ? "bg-red-500/10 border-red-500/30"
            : remainingGenerations <= 2
              ? "bg-[#ff6b00]/10 border-[#ff6b00]/30"
              : "bg-[#00f0ff]/10 border-[#00f0ff]/30"
          }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {remainingGenerations <= 0 ? (
                <Lock className="w-5 h-5 text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]" />
              ) : (
                <Sparkles className={`w-5 h-5 ${remainingGenerations <= 2 ? "text-[#ff6b00] drop-shadow-[0_0_5px_rgba(255,107,0,0.5)]" : "text-[#00f0ff] drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]"
                  }`} />
              )}
              <span className={`text-sm font-medium ${remainingGenerations <= 0
                  ? "text-red-400"
                  : remainingGenerations <= 2
                    ? "text-[#ff6b00]"
                    : "text-[#00f0ff]"
                }`}>
                {remainingGenerations <= 0
                  ? "Лимит исчерпан"
                  : `Осталось генераций: ${remainingGenerations} из 5`
                }
              </span>
            </div>
            {remainingGenerations > 0 && (
              <span className="text-xs text-gray-500">
                Навсегда
              </span>
            )}
          </div>
        </div>
      )}

      {/* Chat Interface */}
      {isAuthenticated && (
        <div className="space-y-4">
          {/* Messages Area */}
          <div className="bg-black/40 border border-white/10 rounded-xl p-4 min-h-[300px] max-h-[400px] overflow-y-auto custom-scrollbar">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-[#ff6b00]/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#ff6b00]/30 shadow-[0_0_15px_rgba(255,107,0,0.2)]">
                  <Sparkles className="w-6 h-6 text-[#ff6b00]" />
                </div>
                <p className="text-gray-300 font-medium mb-1">
                  Расскажите о своей карьере
                </p>
                <p className="text-gray-500 text-sm font-light">
                  Например: &quot;Frontend разработчик с 3 годами опыта, React, TypeScript, ищу работу в product компании&quot;
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${message.role === "user"
                          ? "bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] text-white shadow-[0_0_15px_rgba(255,107,0,0.4)]"
                          : "bg-[#1f2833]/80 backdrop-blur-md text-white border border-white/10"
                        }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <span className={`text-xs mt-1 block ${message.role === "user" ? "text-white/70" : "text-gray-500"}`}>
                        {message.timestamp.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-[#1f2833]/80 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/10">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#ff6b00]" />
                        <span className="text-sm text-gray-400">Генерация резюме...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area - Styled like ChatInput */}
          <div className="bg-[#1f2833]/50 backdrop-blur-md rounded-3xl shadow-[0_0_20px_rgba(0,0,0,0.4)] border border-white/10">
            <div className="flex items-end gap-2 p-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Опишите ваш опыт и желаемую позицию..."
                disabled={loading || (remainingGenerations !== null && remainingGenerations <= 0)}
                rows={1}
                className="flex-1 resize-none bg-transparent px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none max-h-[200px] text-sm custom-scrollbar"
              />
              {loading ? (
                <button
                  disabled
                  className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/50 text-white cursor-not-allowed border border-red-500/20"
                >
                  <Loader2 className="w-5 h-5 animate-spin" />
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || (remainingGenerations !== null && remainingGenerations <= 0)}
                  className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${input.trim() && (remainingGenerations === null || remainingGenerations > 0)
                      ? "bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] text-white hover:shadow-[0_0_15px_rgba(255,107,0,0.5)]"
                      : "bg-white/5 text-gray-600 cursor-not-allowed border border-white/5"
                    }`}
                >
                  <Wand2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Hints */}
          <div className="bg-[#00f0ff]/10 rounded-lg p-4 border border-[#00f0ff]/20">
            <p className="text-xs text-[#00f0ff]">
              <strong>Совет:</strong> Чем больше деталей вы предоставите (опыт, навыки, достижения),
              тем качественнее будет резюме. AI может создать полный профиль на основе краткого описания.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Wand2, Loader2, Check, AlertCircle } from "lucide-react";
import { improveTextWithAICached, validateTextForAI, hasAIAccess, formatAIResponse } from "@/lib/resume-ai";

interface AIImprovementButtonProps {
  text: string;
  field: "about" | "experience_description" | "skills" | "achievements";
  userId: string;
  onTextApply: (improvedText: string) => void;
  isPro?: boolean;
  isProTrial?: boolean;
  context?: string;
  className?: string;
}

export default function AIImprovementButton({
  text,
  field,
  userId,
  onTextApply,
  isPro,
  isProTrial,
  context,
  className = "",
}: AIImprovementButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Проверка доступа к AI
  const canUseAI = hasAIAccess(isPro, isProTrial);

  const handleImprove = async () => {
    // Проверка доступа
    if (!canUseAI) {
      setError("AI функции доступны только на Pro подписке");
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Валидация текста
    if (!validateTextForAI(text)) {
      setError("Текст слишком короткий или некорректный");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setLoading(true);
    setError(null);
    setSucceeded(false);
    setShowSuggestions(false);

    try {
      const response = await improveTextWithAICached(text, field, userId, context);

      // Применяем улучшение
      onTextApply(response.improved_text);

      setSucceeded(true);
      setSuggestions(response.suggestions || []);

      // Сбрасываем статус успеха через 3 секунды
      setTimeout(() => setSucceeded(false), 3000);

      // Если есть предложения, показываем их
      if (response.suggestions && response.suggestions.length > 0) {
        setShowSuggestions(true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ошибка при улучшении текста";
      setError(message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Определяем текст кнопки в зависимости от статуса
  const getButtonText = () => {
    if (loading) return "Улучшение...";
    if (succeeded) return "Улучшено!";
    return "Улучшить через AI";
  };

  // Определяем иконку
  const getIcon = () => {
    if (loading) return <Loader2 className="w-4 h-4 animate-spin" />;
    if (succeeded) return <Check className="w-4 h-4" />;
    if (error) return <AlertCircle className="w-4 h-4" />;
    return <Wand2 className="w-4 h-4" />;
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={handleImprove}
        disabled={loading || !canUseAI}
        className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
          ${loading
            ? "bg-orange-100 text-orange-700 cursor-wait"
            : succeeded
            ? "bg-green-100 text-green-700"
            : error
            ? "bg-red-100 text-red-700"
            : "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700"
          }
          ${!canUseAI ? "opacity-50 cursor-not-allowed" : ""}
          disabled:opacity-70 disabled:cursor-not-allowed
        `}
        title={
          !canUseAI
            ? "AI функции доступны только на Pro подписке"
            : "Улучшить текст с помощью AI"
        }
      >
        {getIcon()}
        {getButtonText()}
      </button>

      {/* Тултип ошибки */}
      {error && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-red-50 border border-red-200 rounded-lg p-3 shadow-lg z-10">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Предложения AI */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-lg z-10">
          <p className="text-sm font-medium text-blue-900 mb-2">
            💡 Рекомендации AI:
          </p>
          <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
            {suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setShowSuggestions(false)}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Закрыть
          </button>
        </div>
      )}

      {/* Про-бейдж для не-pro пользователей */}
      {!canUseAI && (
        <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg">
          PRO
        </div>
      )}
    </div>
  );
}

// Упрощенная версия без кнопки (только иконка)
interface AIImprovementIconProps {
  text: string;
  field: "about" | "experience_description" | "skills" | "achievements";
  userId: string;
  onTextApply: (improvedText: string) => void;
  isPro?: boolean;
  isProTrial?: boolean;
  context?: string;
}

export function AIImprovementIcon({
  text,
  field,
  userId,
  onTextApply,
  isPro,
  isProTrial,
  context,
}: AIImprovementIconProps) {
  const [loading, setLoading] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const canUseAI = hasAIAccess(isPro, isProTrial);

  const handleImprove = async () => {
    if (!canUseAI || !validateTextForAI(text)) return;

    setLoading(true);
    try {
      const response = await improveTextWithAICached(text, field, userId, context);
      onTextApply(response.improved_text);
      setSucceeded(true);
      setTimeout(() => setSucceeded(false), 2000);
    } catch {
      // Ошибка, но не показываем её для компактной версии
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleImprove}
      disabled={loading || !canUseAI}
      className={`
        inline-flex items-center justify-center w-8 h-8 rounded-full transition-all
        ${loading
          ? "bg-orange-100 text-orange-700"
          : succeeded
          ? "bg-green-100 text-green-700"
          : "bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-600"
        }
        ${!canUseAI ? "opacity-40 cursor-not-allowed" : ""}
        disabled:cursor-wait
      `}
      title={
        !canUseAI
          ? "AI функции доступны только на Pro подписке"
          : "Улучшить текст с помощью AI"
      }
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : succeeded ? (
        <Check className="w-4 h-4" />
      ) : (
        <Wand2 className="w-4 h-4" />
      )}
    </button>
  );
}

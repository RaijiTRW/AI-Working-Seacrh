"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

interface TrialExpiredModalProps {
  isProTrialExpired: boolean;
  price: number;
  onCheckout: () => Promise<string | null>;
}

const DISMISS_STORAGE_KEY = "pro_trial_expired_dismissed_at";
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 часа

export function TrialExpiredModal({
  isProTrialExpired,
  price,
  onCheckout,
}: TrialExpiredModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Не показываем на страницах подписки и авторизации
  const excludedPaths = ["/subscription", "/auth"];
  const shouldShow = !excludedPaths.some((p) => pathname?.startsWith(p));

  useEffect(() => {
    if (!isProTrialExpired || !shouldShow) {
      setIsOpen(false);
      return;
    }

    // Проверяем, не отклонил ли пользователь модалку недавно
    const dismissedAt = localStorage.getItem(DISMISS_STORAGE_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      if (Date.now() - dismissedTime < DISMISS_DURATION_MS) {
        return; // Ещё не прошло 24 часа
      }
    }

    setIsOpen(true);
  }, [isProTrialExpired, shouldShow]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_STORAGE_KEY, Date.now().toString());
    setIsOpen(false);
  };

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const paymentUrl = await onCheckout();
      if (paymentUrl) {
        window.location.href = paymentUrl;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToSubscription = () => {
    setIsOpen(false);
    router.push("/subscription");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
        {/* Иконка */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* Заголовок */}
        <h2 className="text-xl font-bold text-center text-gray-900 mb-2">
          Pro Trial закончился
        </h2>

        {/* Описание */}
        <p className="text-gray-600 text-center mb-6">
          Вы перешли на Base план. Оформите Pro для полного доступа к AI-поиску
        </p>

        {/* Сравнение планов */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Pro vs Base:</h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <svg
                className="w-5 h-5 text-green-500 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span><b>15</b> запросов/день (Base: 3)</span>
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <svg
                className="w-5 h-5 text-green-500 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Поиск <b>в сети</b> (Base: только лента)</span>
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <svg
                className="w-5 h-5 text-green-500 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Возможность докупить запросы
            </li>
          </ul>
          <p className="text-xs text-gray-500 mt-3">
            Лента вакансий и чат с работодателями — бесплатно для всех
          </p>
        </div>

        {/* Кнопки */}
        <div className="space-y-3">
          <button
            onClick={handleCheckout}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Загрузка...
              </span>
            ) : (
              `Оформить подписку — ${price} ₽/мес`
            )}
          </button>

          <button
            onClick={handleGoToSubscription}
            className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
          >
            Подробнее о подписке
          </button>

          <button
            onClick={handleDismiss}
            className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Напомнить позже
          </button>
        </div>
      </div>
    </div>
  );
}

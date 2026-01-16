"use client";

import { useState } from "react";
import type { SubscriptionInfo } from "@/lib/api";

interface SubscriptionCardProps {
  subscription: SubscriptionInfo;
  onCheckout: () => Promise<string | null>;
  onBuyExtra: () => Promise<string | null>;
}

export function SubscriptionCard({
  subscription,
  onCheckout,
  onBuyExtra,
}: SubscriptionCardProps) {
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isExtraLoading, setIsExtraLoading] = useState(false);

  const { limits, prices, is_pro, is_pro_trial, is_base } = subscription;
  const sub = subscription.subscription;

  const handleCheckout = async () => {
    setIsCheckoutLoading(true);
    try {
      const url = await onCheckout();
      if (url) window.location.href = url;
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const handleBuyExtra = async () => {
    setIsExtraLoading(true);
    try {
      const url = await onBuyExtra();
      if (url) window.location.href = url;
    } finally {
      setIsExtraLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div
        className={`px-6 py-4 ${
          is_pro
            ? "bg-gradient-to-r from-blue-600 to-blue-700"
            : is_pro_trial
            ? "bg-gradient-to-r from-purple-600 to-purple-700"
            : is_base
            ? "bg-gradient-to-r from-gray-500 to-gray-600"
            : "bg-gradient-to-r from-gray-400 to-gray-500"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg">
              {is_pro ? "Pro подписка" : is_pro_trial ? "Pro Trial" : is_base ? "Base план" : "Нет подписки"}
            </h3>
            {sub && sub.expires_at && (
              <p className="text-white/80 text-sm">
                {sub.status === "active"
                  ? `Активна до ${formatDate(sub.expires_at)}`
                  : "Истекла"}
              </p>
            )}
            {is_base && (
              <p className="text-white/80 text-sm">
                Бесплатный навсегда
              </p>
            )}
          </div>
          {sub && sub.days_left !== null && (
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                sub.status === "active"
                  ? "bg-white/20 text-white"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {sub.status === "active" ? (sub.days_left > 0 ? `${sub.days_left} дн.` : "Сегодня") : "Истекла"}
            </div>
          )}
          {is_base && (
            <div className="px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white">
              ∞
            </div>
          )}
        </div>
      </div>

      {/* Limits */}
      <div className="p-6">
        <h4 className="font-medium text-gray-900 mb-4">Ваши запросы</h4>

        {/* Daily requests */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Дневной лимит</span>
            <span className="font-medium text-gray-900">
              {limits.daily_used} / {limits.daily_limit}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                limits.daily_used >= limits.daily_limit
                  ? "bg-red-500"
                  : limits.daily_used >= limits.daily_limit * 0.8
                  ? "bg-amber-500"
                  : "bg-blue-500"
              }`}
              style={{
                width: `${Math.min(100, (limits.daily_used / limits.daily_limit) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Bonus requests */}
        {limits.bonus_requests > 0 && (
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl mb-4">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm text-green-700">Бонусные запросы</span>
            </div>
            <span className="font-bold text-green-700">{limits.bonus_requests}</span>
          </div>
        )}

        {/* Remaining */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-6">
          <span className="text-gray-600">Осталось сегодня</span>
          <span
            className={`font-bold text-lg ${
              limits.remaining > 0 ? "text-blue-600" : "text-red-500"
            }`}
          >
            {limits.remaining}
          </span>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {!is_pro && (
            <button
              onClick={handleCheckout}
              disabled={isCheckoutLoading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isCheckoutLoading ? (
                <>
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
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                  Оформить Pro — {prices.subscription} ₽/мес
                </>
              )}
            </button>
          )}

          {is_pro && (
            <button
              onClick={handleBuyExtra}
              disabled={isExtraLoading}
              className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isExtraLoading ? (
                <>
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
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Докупить {prices.extra_requests_count} запросов — {prices.extra_requests} ₽
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

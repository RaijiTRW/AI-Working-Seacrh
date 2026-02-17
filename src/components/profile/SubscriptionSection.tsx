"use client";

import { useState } from "react";
import Link from "next/link";
import { useSubscriptionContext } from "@/components/subscription";
import { supabase } from "@/lib/supabase";

export default function SubscriptionSection() {
  const { subscription, loading, checkout, buyExtra, cancelAutoRenewal, refresh } = useSubscriptionContext();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [enablingAutoRenew, setEnablingAutoRenew] = useState(false);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-20 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <p className="text-gray-500">Не удалось загрузить информацию о подписке</p>
      </div>
    );
  }

  const { limits, prices, is_pro, is_pro_trial, is_base, is_pro_trial_expired, discount } = subscription;
  const sub = subscription.subscription;

  // Проверяем есть ли скидка на первую покупку
  const hasDiscount = discount?.enabled && discount?.percent > 0;
  const discountedPrice = prices.subscription_discounted || prices.subscription;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleCheckout = async () => {
    const url = await checkout();
    if (url) window.location.href = url;
  };

  const handleBuyExtra = async () => {
    const url = await buyExtra();
    if (url) window.location.href = url;
  };

  const handleCancelAutoRenewal = async () => {
    setCanceling(true);
    const success = await cancelAutoRenewal();
    setCanceling(false);
    setShowCancelModal(false);
    if (success) {
      await refresh();
    }
  };

  const handleEnableAutoRenewal = async () => {
    setEnablingAutoRenew(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert("Нет активной сессии. Войдите снова.");
        return;
      }

      const response = await fetch("/api/subscription/enable-auto-renewal", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Не удалось включить автопродление");
        return;
      }

      // Перенаправляем на платёжную страницу YooKassa
      if (data.payment_url) {
        window.location.href = data.payment_url;
      }
    } catch (error) {
      alert("Произошла ошибка. Попробуйте позже.");
    } finally {
      setEnablingAutoRenew(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current subscription */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div
          className={`px-6 py-4 ${is_pro
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
              {is_base ? (
                <p className="text-white/80 text-sm">
                  Бесплатный навсегда
                </p>
              ) : sub && sub.expires_at && (
                <p className="text-white/80 text-sm">
                  {sub.status === "active"
                    ? `Активна до ${formatDate(sub.expires_at)}`
                    : "Истекла"}
                </p>
              )}
            </div>
            {is_base ? (
              <div className="px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white">
                ∞
              </div>
            ) : sub && sub.days_left !== null && (
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${sub.status === "active"
                    ? "bg-white/20 text-white"
                    : "bg-red-100 text-red-700"
                  }`}
              >
                {sub.status === "active"
                  ? sub.days_left > 0
                    ? `${sub.days_left} дн.`
                    : "Сегодня"
                  : "Истекла"}
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Limits */}
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
                className={`h-full rounded-full transition-all ${limits.daily_used >= limits.daily_limit
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
            <p className="text-xs text-gray-500 mt-1">
              Обновляется каждый день в полночь
            </p>
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
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <span className="text-gray-600">Осталось сегодня</span>
            <span
              className={`font-bold text-lg ${limits.remaining > 0 ? "text-blue-600" : "text-red-500"
                }`}
            >
              {limits.remaining}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h4 className="font-medium text-gray-900 mb-4">Управление подпиской</h4>

        {/* Discount banner */}
        {!is_pro && hasDiscount && (
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl mb-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded animate-pulse">
                -{discount?.percent}%
              </span>
              <span className="text-sm text-green-700 font-medium">
                Скидка на первую покупку!
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm text-gray-400 line-through">{prices.subscription} ₽</span>
              <span className="ml-2 text-lg font-bold text-green-600">{discountedPrice} ₽</span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {!is_pro && (
            <button
              onClick={handleCheckout}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
            >
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
              {hasDiscount ? (
                <>
                  Оформить Pro — <span className="line-through opacity-60 mx-1">{prices.subscription}</span> {discountedPrice} ₽
                </>
              ) : (
                <>Оформить Pro подписку — {prices.subscription} ₽/мес</>
              )}
            </button>
          )}

          {is_pro && (
            <button
              onClick={handleBuyExtra}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors"
            >
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
            </button>
          )}

          {is_pro && subscription.has_saved_payment_method && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl transition-colors border border-red-200"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Отменить автопродление подписки
            </button>
          )}

          {is_pro && !subscription.has_saved_payment_method && (
            <button
              onClick={handleEnableAutoRenewal}
              disabled={enablingAutoRenew}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-green-50 hover:bg-green-100 disabled:bg-green-50/50 text-green-600 disabled:text-green-600/50 font-medium rounded-xl transition-colors border border-green-200"
            >
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {enablingAutoRenew ? "Загрузка..." : "Включить автопродление"}
            </button>
          )}

          <Link
            href="/subscription"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
          >
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
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Подробнее о подписке
          </Link>
        </div>
      </div>

      {/* Pro benefits */}
      {!is_pro && (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 relative overflow-hidden">
          {hasDiscount && (
            <div className="absolute top-4 right-4">
              <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded animate-pulse">
                -{discount?.percent}% на первую покупку
              </span>
            </div>
          )}
          <h4 className="font-bold text-blue-900 mb-3">
            Что входит в Pro
            {hasDiscount && (
              <span className="ml-2 text-green-600">
                — всего {discountedPrice} ₽
              </span>
            )}
          </h4>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-blue-800">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm">15 AI-запросов каждый день</span>
            </li>
            <li className="flex items-center gap-2 text-blue-800">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm">Поиск в ленте + в сети (HH, SuperJob, Avito)</span>
            </li>
            <li className="flex items-center gap-2 text-blue-800">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm">Возможность докупить запросы</span>
            </li>
            <li className="flex items-center gap-2 text-blue-800">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm">Приоритетная поддержка</span>
            </li>
          </ul>
          {is_base && (
            <div className="mt-4 p-3 bg-amber-100 rounded-lg">
              <p className="text-sm text-amber-900">
                <strong>Base план:</strong> 3 запроса/день, только поиск в ленте
              </p>
            </div>
          )}
          <p className="text-xs text-blue-700/70 mt-3">
            Лента вакансий и чат с работодателями — бесплатно для всех
          </p>
        </div>
      )}

      {/* Модальное окно отмены подписки */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Отменить автопродление подписки?
            </h3>

            <div className="space-y-3 mb-6 text-sm text-gray-600">
              <p>После отмены:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Автопродление подписки будет отключено</li>
                <li>Сохранённая платёжная карта будет удалена</li>
                <li>Подписка останется активной до конца оплаченного периода</li>
                <li>После окончания периода вы перейдёте на бесплатный Base план</li>
              </ul>
              <p className="mt-4">
                <strong>Что вы потеряете после окончания подписки:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>15 AI-запросов в день → 3 запроса в день</li>
                <li>Поиск в сети (HH, SuperJob, Avito)</li>
                <li>Возможность докупить запросы</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                disabled={canceling}
              >
                Отмена
              </button>
              <button
                onClick={handleCancelAutoRenewal}
                className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                disabled={canceling}
              >
                {canceling ? "Отмена..." : "Отменить подписку"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface DiscountInfo {
  enabled: boolean;
  percent: number;
  regular_price: number;
  discounted_price: number;
}

export default function Pricing() {
  const [discount, setDiscount] = useState<DiscountInfo | null>(null);

  useEffect(() => {
    fetch("/api/discount")
      .then(res => res.json())
      .then(data => setDiscount(data))
      .catch(() => setDiscount({ enabled: false, percent: 0, regular_price: 799, discounted_price: 799 }));
  }, []);

  const regularPrice = discount?.regular_price || 799;
  const discountedPrice = discount?.discounted_price || 799;
  const hasDiscount = discount?.enabled && discount?.percent > 0;

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4">
          Простые цены
        </h2>
        <p className="text-center text-gray-600 mb-10 md:mb-16 max-w-xl mx-auto">
          Начни с Pro Trial, затем выбери удобный план
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Pro Trial */}
          <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 text-white relative overflow-hidden">
            {/* New user badge */}
            <div className="absolute top-4 right-4">
              <span className="inline-block px-3 py-1 text-xs font-medium bg-white/20 rounded-full">
                При регистрации
              </span>
            </div>

            <div className="mb-6">
              <span className="inline-block px-3 py-1 text-sm font-medium bg-white/20 rounded-full mb-3">
                Пробный
              </span>
              <h3 className="text-xl md:text-2xl font-bold">Pro Trial</h3>
            </div>

            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-3xl md:text-4xl font-bold">0 ₽</span>
              <span className="text-white/70">/ 7 дней</span>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-green-300 flex-shrink-0"
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
                <span className="text-sm md:text-base">
                  <strong>15 AI-запросов</strong> каждый день
                </span>
              </li>
              <li className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-green-300 flex-shrink-0"
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
                <span className="text-sm md:text-base">Поиск в ленте + в сети</span>
              </li>
              <li className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-green-300 flex-shrink-0"
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
                <span className="text-sm md:text-base">Без привязки карты</span>
              </li>
            </ul>

            <Link
              href="/auth"
              className="block w-full py-3 px-4 bg-white hover:bg-gray-100 text-purple-600 font-medium rounded-xl text-center transition-colors text-sm md:text-base"
            >
              Начать бесплатно
            </Link>
          </div>

          {/* Base */}
          <div className="p-6 md:p-8 rounded-2xl bg-gray-50 border border-gray-200">
            <div className="mb-6">
              <span className="inline-block px-3 py-1 text-sm font-medium bg-gray-200 text-gray-700 rounded-full mb-3">
                Бесплатно
              </span>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900">
                Base
              </h3>
            </div>

            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-3xl md:text-4xl font-bold text-gray-900">0 ₽</span>
              <span className="text-gray-500">/ навсегда</span>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-3 text-gray-700">
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
                <span className="text-sm md:text-base">3 AI-запроса в день</span>
              </li>
              <li className="flex items-center gap-3 text-gray-700">
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
                <span className="text-sm md:text-base">Только поиск в ленте</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <svg
                  className="w-5 h-5 flex-shrink-0"
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
                <span className="text-sm md:text-base">Поиск в сети недоступен</span>
              </li>
            </ul>

            <div className="block w-full py-3 px-4 bg-gray-200 text-gray-500 font-medium rounded-xl text-center text-sm md:text-base">
              Автоматически после Pro Trial
            </div>
          </div>

          {/* Pro */}
          <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white relative overflow-hidden">
            {/* Discount badge */}
            <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
              {hasDiscount && (
                <span className="inline-block px-3 py-1 text-xs font-bold bg-green-500 text-white rounded-full animate-pulse">
                  -{discount.percent}% на 1-ю покупку
                </span>
              )}
              <span className="inline-block px-3 py-1 text-xs font-medium bg-white/20 rounded-full">
                Популярный
              </span>
            </div>

            <div className="mb-6">
              <span className="inline-block px-3 py-1 text-sm font-medium bg-white/20 rounded-full mb-3">
                Pro
              </span>
              <h3 className="text-xl md:text-2xl font-bold">Pro подписка</h3>
            </div>

            <div className="mb-6">
              {hasDiscount ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg text-white/50 line-through">{regularPrice} ₽</span>
                    <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded">
                      -{discount.percent}%
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl md:text-4xl font-bold">{discountedPrice} ₽</span>
                    <span className="text-white/70">/ первый месяц</span>
                  </div>
                  <p className="text-xs text-white/60">далее {regularPrice} ₽/мес</p>
                </div>
              ) : (
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl md:text-4xl font-bold">{regularPrice} ₽</span>
                  <span className="text-white/70">/ месяц</span>
                </div>
              )}
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-green-300 flex-shrink-0"
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
                <span className="text-sm md:text-base">
                  <strong>15 AI-запросов</strong> каждый день
                </span>
              </li>
              <li className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-green-300 flex-shrink-0"
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
                <span className="text-sm md:text-base">Поиск в ленте + в сети</span>
              </li>
              <li className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-green-300 flex-shrink-0"
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
                <span className="text-sm md:text-base">
                  Докупка запросов <span className="text-white/70">(99 ₽ / 10 шт.)</span>
                </span>
              </li>
              <li className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-green-300 flex-shrink-0"
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
                <span className="text-sm md:text-base">
                  <strong>Приоритетная</strong> поддержка
                </span>
              </li>
            </ul>

            <Link
              href="/auth"
              className="block w-full py-3 px-4 bg-white hover:bg-gray-100 text-blue-600 font-medium rounded-xl text-center transition-colors text-sm md:text-base"
            >
              {hasDiscount ? `Оформить за ${discountedPrice} ₽` : "Оформить подписку"}
            </Link>
          </div>
        </div>

        {/* Bottom note */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Оплата через YooKassa. Банковские карты, СБП, электронные кошельки.
        </p>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
    <section
      className="py-16 md:py-24 px-4 sm:px-6"
      style={{
        background: "linear-gradient(180deg, #f8f8f8, #ffffff)"
      }}
    >
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4">
          Простые цены
        </h2>
        <p className="text-center text-gray-600 mb-10 md:mb-16 max-w-xl mx-auto">
          Начни с Pro Trial, затем выбери удобный план
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Pro Trial - Neumorphic raised */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -6 }}
            className="p-6 md:p-8 rounded-3xl relative overflow-hidden"
            style={{
              background: "linear-gradient(145deg, #9333ea, #7e22ce)",
              boxShadow: "12px 12px 28px rgba(100,50,150,0.3), -8px -8px 20px rgba(200,150,255,0.2), inset 0 2px 4px rgba(255,255,255,0.15)"
            }}
          >
            {/* Top highlight */}
            <div
              className="absolute top-0 left-4 right-4 h-8 rounded-b-full blur-sm pointer-events-none"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.3), transparent)",
              }}
            />

            <div className="text-white relative z-10">
              {/* New user badge */}
              <div className="absolute top-4 right-4">
                <span
                  className="inline-block px-3 py-1 text-xs font-medium rounded-full"
                  style={{
                    background: "linear-gradient(145deg, rgba(255,255,255,0.25), rgba(255,255,255,0.1))",
                    boxShadow: "inset 2px 2px 4px rgba(0,0,0,0.1), inset -1px -1px 2px rgba(255,255,255,0.1)"
                  }}
                >
                  При регистрации
                </span>
              </div>

              <div className="mb-6">
                <span
                  className="inline-block px-3 py-1 text-sm font-medium rounded-full mb-3"
                  style={{
                    background: "linear-gradient(145deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))",
                    boxShadow: "inset 2px 2px 4px rgba(0,0,0,0.1), inset -1px -1px 2px rgba(255,255,255,0.05)"
                  }}
                >
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
                className="block w-full py-3 px-4 font-medium rounded-xl text-center text-sm md:text-base relative overflow-hidden"
                style={{
                  background: "linear-gradient(145deg, #ffffff, #e5e5e5)",
                  color: "#9333ea",
                  boxShadow: "inset 3px 3px 6px rgba(150,150,150,0.15), inset -2px -2px 4px rgba(255,255,255,0.8)"
                }}
              >
                Начать бесплатно
              </Link>

              {/* Микрокопирайтинг снижения риска */}
              <div className="mt-4 flex flex-col gap-1.5 text-xs text-white/80">
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Без привязки карты</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Отменить можно в любой момент</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Регистрация за 30 секунд</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Base - Neumorphic raised */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ y: -6 }}
            className="p-6 md:p-8 rounded-3xl relative overflow-hidden"
            style={{
              background: "linear-gradient(145deg, #ffffff, #f0f0f0)",
              boxShadow: "12px 12px 24px rgba(160,160,160,0.25), -12px -12px 24px rgba(255,255,255,0.8), inset 0 2px 4px rgba(255,255,255,0.5)"
            }}
          >
            {/* Top highlight */}
            <div
              className="absolute top-0 left-4 right-4 h-8 rounded-b-full blur-sm pointer-events-none"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.5), transparent)",
              }}
            />

            <div className="mb-6">
              <span
                className="inline-block px-3 py-1 text-sm font-medium text-gray-700 rounded-full mb-3"
                style={{
                  background: "linear-gradient(145deg, #e5e5e5, #d4d4d4)",
                  boxShadow: "inset 2px 2px 4px rgba(100,100,100,0.15), inset -1px -1px 2px rgba(255,255,255,0.5)"
                }}
              >
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

            <div
              className="block w-full py-3 px-4 font-medium rounded-xl text-center text-sm md:text-base text-gray-500"
              style={{
                background: "linear-gradient(145deg, #e5e5e5, #d4d4d4)",
                boxShadow: "inset 3px 3px 6px rgba(100,100,100,0.15), inset -2px -2px 4px rgba(255,255,255,0.5)"
              }}
            >
              Автоматически после Pro Trial
            </div>
          </motion.div>

          {/* Pro - Neumorphic raised */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ y: -6 }}
            className="p-6 md:p-8 rounded-3xl relative overflow-hidden"
            style={{
              background: "linear-gradient(145deg, #3b82f6, #1d4ed8)",
              boxShadow: "12px 12px 28px rgba(30,80,200,0.3), -8px -8px 20px rgba(100,180,255,0.2), inset 0 2px 4px rgba(255,255,255,0.15)"
            }}
          >
            {/* Top highlight */}
            <div
              className="absolute top-0 left-4 right-4 h-8 rounded-b-full blur-sm pointer-events-none"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.3), transparent)",
              }}
            />

            <div className="text-white relative z-10">
              {/* Discount badge */}
              <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                {hasDiscount && (
                  <motion.span
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="inline-block px-3 py-1 text-xs font-bold rounded-full"
                    style={{
                      background: "linear-gradient(135deg, #22c55e, #16a34a)",
                      boxShadow: "0 2px 8px rgba(34,197,94,0.4), inset 0 1px 0 rgba(255,255,255,0.2)"
                    }}
                  >
                    -{discount.percent}% на 1-ю покупку
                  </motion.span>
                )}
                <span
                  className="inline-block px-3 py-1 text-xs font-medium rounded-full"
                  style={{
                    background: "linear-gradient(145deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))",
                    boxShadow: "inset 2px 2px 4px rgba(0,0,0,0.1), inset -1px -1px 2px rgba(255,255,255,0.05)"
                  }}
                >
                  Популярный
                </span>
              </div>

              <div className="mb-6">
                <span
                  className="inline-block px-3 py-1 text-sm font-medium rounded-full mb-3"
                  style={{
                    background: "linear-gradient(145deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))",
                    boxShadow: "inset 2px 2px 4px rgba(0,0,0,0.1), inset -1px -1px 2px rgba(255,255,255,0.05)"
                  }}
                >
                  Pro
                </span>
                <h3 className="text-xl md:text-2xl font-bold">Pro подписка</h3>
              </div>

              <div className="mb-6">
                {hasDiscount ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg text-white/50 line-through">{regularPrice} ₽</span>
                      <span
                        className="px-2 py-0.5 text-white text-xs font-bold rounded"
                        style={{
                          background: "linear-gradient(135deg, #22c55e, #16a34a)",
                          boxShadow: "0 2px 6px rgba(34,197,94,0.4)"
                        }}
                      >
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
                className="block w-full py-3 px-4 font-medium rounded-xl text-center text-sm md:text-base relative overflow-hidden"
                style={{
                  background: "linear-gradient(145deg, #ffffff, #e5e5e5)",
                  color: "#1d4ed8",
                  boxShadow: "inset 3px 3px 6px rgba(100,100,100,0.15), inset -2px -2px 4px rgba(255,255,255,0.8)"
                }}
              >
                {hasDiscount ? `Оформить за ${discountedPrice} ₽` : "Оформить подписку"}
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Гарантия - Neumorphic */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 p-6 rounded-3xl max-w-2xl mx-auto relative overflow-hidden"
          style={{
            background: "linear-gradient(145deg, #f0fdf4, #dcfce7)",
            boxShadow: "12px 12px 24px rgba(20,150,50,0.15), -12px -12px 24px rgba(255,255,255,0.9), inset 0 2px 4px rgba(255,255,255,0.6)"
          }}
        >
          {/* Top highlight */}
          <div
            className="absolute top-0 left-8 right-8 h-8 rounded-b-full blur-sm pointer-events-none"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.5), transparent)",
            }}
          />

          <div className="flex items-start gap-4 relative z-10">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(145deg, #bbf7d0, #86efac)",
                boxShadow: "4px 4px 10px rgba(20,150,50,0.2), -3px -3px 8px rgba(200,255,200,0.4), inset 0 2px 4px rgba(255,255,255,0.5)"
              }}
            >
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-green-900 mb-1">
                Гарантия: 7 дней Pro бесплатно
              </h4>
              <p className="text-sm text-green-700">
                Попробуй все возможности без риска. Не понравится — просто не продлевай.
                Никаких скрытых списаний, карту не спрашиваем.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Bottom note */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Оплата через YooKassa. Банковские карты, СБП, электронные кошельки.
        </p>
      </div>
    </section>
  );
}

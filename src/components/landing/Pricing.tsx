"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

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
      .catch(() => setDiscount({ enabled: false, percent: 0, regular_price: 499, discounted_price: 499 }));
  }, []);

  const regularPrice = discount?.regular_price || 499;
  const discountedPrice = discount?.discounted_price || 499;
  const hasDiscount = discount?.enabled && discount?.percent > 0;

  return (
    <section className="py-20 md:py-32 px-4 sm:px-6 bg-[#0b0c10] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00f0ff]/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-6">
            Прозрачные тарифы
          </h2>
          <p className="text-lg text-[#c5c6c7] max-w-xl mx-auto font-light">
            Начни с бесплатного периода Pro, затем выбери план, который идеально подходит твоим задачам.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Base */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            className="p-8 md:p-10 rounded-3xl bg-[#1f2833]/30 backdrop-blur-md border border-[#c5c6c7]/10 flex flex-col"
          >
            <div className="mb-6">
              <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider bg-[#1f2833] text-[#c5c6c7] rounded-full border border-[#c5c6c7]/20 mb-4">
                Бесплатный
              </span>
              <h3 className="text-2xl font-bold text-white">
                Base
              </h3>
            </div>

            <div className="flex items-baseline gap-2 mb-8">
              <span className="text-4xl md:text-5xl font-black text-white">0 ₽</span>
              <span className="text-[#c5c6c7]/60 font-medium">/ всегда</span>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3 text-[#c5c6c7]">
                <svg className="w-5 h-5 text-[#c5c6c7] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>3 AI-запроса в день</span>
              </li>
              <li className="flex items-start gap-3 text-[#c5c6c7]">
                <svg className="w-5 h-5 text-[#c5c6c7] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Только поиск в пределах платформы</span>
              </li>
              <li className="flex items-start gap-3 text-[#c5c6c7]/40">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Глобальный поиск в сети недоступен</span>
              </li>
            </ul>

            <div className="w-full py-4 bg-[#0b0c10] text-[#c5c6c7] font-bold rounded-xl text-center border border-[#1f2833]">
              Текущий базовый план
            </div>
          </motion.div>

          {/* Pro + Trial */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            className="p-8 md:p-10 rounded-3xl bg-gradient-to-br from-[#00f0ff]/10 to-[#1f2833]/40 backdrop-blur-md border border-[#00f0ff]/30 shadow-[0_0_30px_rgba(0,240,255,0.1)] relative flex flex-col overflow-hidden"
          >
            {/* Glowing top line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00f0ff] to-[#00c0cc] shadow-[0_0_10px_#00f0ff]" />

            {/* Discount badge */}
            <div className="absolute top-6 right-6 flex flex-col items-end gap-2">
              {hasDiscount && (
                <span className="inline-block px-3 py-1 text-xs font-bold bg-[#ff6b00] text-white rounded-full animate-pulse shadow-[0_0_10px_rgba(255,107,0,0.5)]">
                  Скидка {discount.percent}%
                </span>
              )}
              <span className="inline-block px-3 py-1 text-xs font-bold bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30 rounded-full">
                Популярный
              </span>
            </div>

            <div className="mb-6">
              <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider bg-[#0b0c10] text-[#00f0ff] border border-[#00f0ff]/20 rounded-full mb-4 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                Pro
              </span>
              <h3 className="text-2xl font-bold text-white">Full Access</h3>
            </div>

            {/* Trial option */}
            <div className="mb-6 p-4 rounded-xl bg-[#0b0c10]/50 border border-[#00f0ff]/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#00ff88]/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#00ff88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <span className="font-bold text-white">3 дня бесплатно</span>
                  <span className="text-[#00ff88] text-xs ml-2 font-medium">Без карты</span>
                </div>
              </div>
              <p className="text-xs text-[#c5c6c7]/80">Оцени мощь алгоритма поиска до оплаты</p>
            </div>

            {/* Price */}
            <div className="mb-8">
              {hasDiscount ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg text-[#c5c6c7]/50 line-through font-medium">{regularPrice} ₽</span>
                    <span className="px-2 py-0.5 bg-[#ff6b00]/20 text-[#ff6b00] text-xs font-bold rounded border border-[#ff6b00]/30">
                      Экономия {discount.percent}%
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl md:text-5xl font-black text-[#00f0ff] drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">{discountedPrice} ₽</span>
                    <span className="text-[#c5c6c7] font-medium">/ 1-й месяц</span>
                  </div>
                  <p className="text-xs text-[#c5c6c7]/60 mt-2">затем {regularPrice} ₽ / мес</p>
                </div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl md:text-5xl font-black text-[#00f0ff] drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">{regularPrice} ₽</span>
                  <span className="text-[#c5c6c7] font-medium">/ месяц</span>
                </div>
              )}
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3 text-white">
                <svg className="w-5 h-5 text-[#00f0ff] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span><strong>15 AI-запросов</strong> каждые 24 часа</span>
              </li>
              <li className="flex items-start gap-3 text-white">
                <svg className="w-5 h-5 text-[#00f0ff] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Тотальный поиск (лента + весь рунет)</span>
              </li>
              <li className="flex items-start gap-3 text-white">
                <svg className="w-5 h-5 text-[#00f0ff] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Моментальное оповещение о новых вакансиях</span>
              </li>
              <li className="flex items-start gap-3 text-white">
                <svg className="w-5 h-5 text-[#00f0ff] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Приоритетная линия поддержки</span>
              </li>
            </ul>

            <Link
              href="/auth"
              className="block w-full py-4 px-4 bg-gradient-to-r from-[#00f0ff] to-[#00c0cc] hover:from-[#00c0cc] hover:to-[#0099a6] text-[#0b0c10] font-bold rounded-xl text-center transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)]"
            >
              {hasDiscount ? `Разблокировать за ${discountedPrice} ₽` : "Активировать план"}
            </Link>

            {/* Trust signals */}
            <div className="mt-6 border-t border-[#00f0ff]/10 pt-4 flex flex-col gap-2 text-xs text-[#c5c6c7]/80">
              <div className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 text-[#00ff88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Полный возврат в течение 14 дней</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Гарантия */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 p-8 rounded-3xl bg-[#1f2833]/30 border border-[#c5c6c7]/10 max-w-2xl mx-auto backdrop-blur-sm"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <div className="w-16 h-16 rounded-full bg-[#ff6b00]/10 border border-[#ff6b00]/30 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(255,107,0,0.2)]">
              <svg className="w-8 h-8 text-[#ff6b00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-xl text-white mb-2">
                Абсолютно прозрачно. Без скрытых списаний.
              </h4>
              <p className="text-sm md:text-base text-[#c5c6c7] leading-relaxed">
                Для активации триала карта не требуется. Вы покупаете подписку лишь тогда, когда убедитесь в эффективности поиска. Отмените в любой момент в личном кабинете.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Bottom note */}
        <p className="text-center text-xs text-[#c5c6c7]/50 mt-10 tracking-widest uppercase">
          Безопасная оплата через YooKassa. Карты, СБП.
        </p>
      </div>
    </section>
  );
}

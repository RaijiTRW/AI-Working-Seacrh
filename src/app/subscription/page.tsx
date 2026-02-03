"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { useSubscription } from "@/lib/useSubscription";
import { SubscriptionCard } from "@/components/subscription";
import AppHeader from "@/components/app/Header";

export default function SubscriptionPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { subscription, loading: subLoading, checkout, buyExtra } = useSubscription();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Universal Header */}
      <AppHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pt-20 sm:pt-24">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Подписка</h1>
        <p className="text-gray-600 mb-8">
          Управляйте подпиской и запросами к AI-поиску
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Current subscription */}
          <div>
            {subscription ? (
              <SubscriptionCard
                subscription={subscription}
                onCheckout={checkout}
                onBuyExtra={buyExtra}
              />
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <p className="text-gray-500 text-center">
                  Загрузка информации о подписке...
                </p>
              </div>
            )}
          </div>

          {/* Pro plan info */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 relative">
              <h3 className="text-white font-bold text-lg">Pro подписка</h3>
              <p className="text-white/80 text-sm">Максимум возможностей</p>
              {subscription?.discount?.enabled && subscription?.discount?.percent > 0 && (
                <span className="absolute top-4 right-4 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded animate-pulse">
                  -{subscription.discount.percent}%
                </span>
              )}
            </div>

            <div className="p-6">
              <div className="mb-6">
                {subscription?.discount?.enabled && subscription?.discount?.percent > 0 ? (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg text-gray-400 line-through">
                        {subscription?.prices.subscription || 799} ₽
                      </span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded">
                        Первая покупка -{subscription.discount.percent}%
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-3xl font-bold text-green-600">
                        {subscription?.prices.subscription_discounted || Math.round((subscription?.prices.subscription || 799) * (1 - subscription.discount.percent / 100))}
                      </span>
                      <span className="text-gray-500">₽ / первый месяц</span>
                    </div>
                    <p className="text-sm text-gray-500">далее {subscription?.prices.subscription || 799} ₽/мес</p>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-3xl font-bold text-gray-900">
                        {subscription?.prices.subscription || 799}
                      </span>
                      <span className="text-gray-500">₽/мес</span>
                    </div>
                    <p className="text-sm text-gray-500">Ежемесячная оплата</p>
                  </>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
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
                  <span className="text-gray-700">
                    <strong>15 AI-запросов</strong> каждый день
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
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
                  <span className="text-gray-700">
                    <strong>Поиск в ленте + в сети</strong> (HH, SuperJob, Avito)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
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
                  <span className="text-gray-700">
                    Возможность <strong>докупить запросы</strong>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
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
                  <span className="text-gray-700">
                    <strong>Приоритетная</strong> поддержка
                  </span>
                </li>
              </ul>

              {/* Extra requests info */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <h4 className="font-medium text-gray-900 mb-2">
                  Нужно больше запросов?
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  Pro-подписчики могут докупить дополнительные запросы:
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-gray-900">
                    {subscription?.prices.extra_requests_count || 10} запросов
                  </span>
                  <span className="text-gray-500">
                    за {subscription?.prices.extra_requests || 99} ₽
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Частые вопросы
          </h2>

          <div className="space-y-4">
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <h3 className="font-medium text-gray-900 mb-2">
                Как работает Pro Trial?
              </h3>
              <p className="text-gray-600 text-sm">
                При регистрации вы получаете <strong>7 дней Pro Trial</strong> с 15 запросами в день и полным доступом к поиску (лента + сеть).
                После окончания автоматически переходите на <strong>Base план</strong> (бесплатно навсегда, 3 запроса/день, только лента)
                или оформите Pro подписку для сохранения полного доступа.
              </p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <h3 className="font-medium text-gray-900 mb-2">
                В чём разница между Base и Pro?
              </h3>
              <p className="text-gray-600 text-sm mb-2">
                <strong>Base (бесплатно):</strong> 3 запроса/день, только поиск в ленте (сохранённые вакансии).
              </p>
              <p className="text-gray-600 text-sm">
                <strong>Pro ({subscription?.prices.subscription || 799}₽/мес{subscription?.discount?.enabled ? `, скидка ${subscription.discount.percent}% на первую покупку` : ""}):</strong> 15 запросов/день, поиск в ленте + в сети (живой парсинг с HH, SuperJob, Avito),
                возможность докупить запросы, приоритетная поддержка.
              </p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <h3 className="font-medium text-gray-900 mb-2">
                Когда обновляется лимит запросов?
              </h3>
              <p className="text-gray-600 text-sm">
                Дневной лимит обновляется каждый день в полночь по московскому
                времени. Бонусные запросы не сгорают и используются после
                исчерпания дневного лимита.
              </p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <h3 className="font-medium text-gray-900 mb-2">
                Как оплатить подписку?
              </h3>
              <p className="text-gray-600 text-sm">
                Оплата проходит через YooKassa. Вы можете оплатить банковской
                картой, через СБП или электронным кошельком.
              </p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <h3 className="font-medium text-gray-900 mb-2">
                Можно ли отменить подписку?
              </h3>
              <p className="text-gray-600 text-sm">
                Да, вы можете отменить подписку в любой момент. Доступ сохранится
                до конца оплаченного периода.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

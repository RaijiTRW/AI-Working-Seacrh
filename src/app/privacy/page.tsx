"use client";

import AppHeader from "@/components/app/Header";
import Footer from "@/components/landing/Footer";

export default function PrivacyPage() {
  const lastUpdated = new Date().toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 pt-24">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Политика конфиденциальности
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Последнее обновление: {lastUpdated}
        </p>

        {/* Section 1: Собираемая информация */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Какую информацию мы собираем</h2>

          <div className="space-y-4">
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <h3 className="font-medium text-gray-900 mb-3">Регистрация и аккаунт</h3>
              <ul className="text-gray-600 text-sm space-y-1">
                <li>• Email адрес (обязательный)</li>
                <li>• Пароль (хешируется через Supabase Auth)</li>
                <li>• Имя, фамилия, отчество</li>
                <li>• Телефон</li>
                <li>• Город</li>
                <li>• Дата рождения</li>
                <li>• Данные из Google OAuth (если выбран вход через Google)</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <h3 className="font-medium text-gray-900 mb-3">Данные профиля и резюме</h3>
              <ul className="text-gray-600 text-sm space-y-1">
                <li>• Желаемая должность</li>
                <li>• Желаемая зарплата</li>
                <li>• Навыки</li>
                <li>• О себе</li>
                <li>• Опыт работы (компания, должность, даты, описание)</li>
                <li>• Образование (учебное заведение, степень, специальность, годы)</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <h3 className="font-medium text-gray-900 mb-3">История активности</h3>
              <ul className="text-gray-600 text-sm space-y-1">
                <li>• Все переписки с AI-помощником (чат-сообщения)</li>
                <li>• История поиска вакансий</li>
                <li>• Статистика использования (количество запросов)</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <h3 className="font-medium text-gray-900 mb-3">Платёжные данные</h3>
              <ul className="text-gray-600 text-sm space-y-1">
                <li>• Только ID платежей от YooKassa (сама карта/платёжные данные хранятся у YooKassa)</li>
                <li>• История подписок и платежей</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 2: Использование данных */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Как мы используем ваши данные</h2>
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl border border-gray-100 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Данные</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Цель использования</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-3 text-gray-700">Email, профиль</td>
                  <td className="px-4 py-3 text-gray-600">Аутентификация, доступ к аккаунту</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-700">Резюме</td>
                  <td className="px-4 py-3 text-gray-600">Генерация поисковых запросов, подбор вакансий</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-700">Чат-сообщения</td>
                  <td className="px-4 py-3 text-gray-600">AI-анализ для поиска вакансий, улучшение сервиса</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-700">Город</td>
                  <td className="px-4 py-3 text-gray-600">Фильтрация вакансий по локации</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-700">Желаемая зарплата</td>
                  <td className="px-4 py-3 text-gray-600">Фильтрация вакансий по зарплате</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-700">Платёжные ID</td>
                  <td className="px-4 py-3 text-gray-600">Подтверждение подписки, доступ к Pro функциям</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3: Внешние сервисы */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Внешние сервисы</h2>

          <div className="overflow-x-auto mb-6">
            <table className="w-full bg-white rounded-xl border border-gray-100 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Сервис</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Назначение</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Какие данные передаём</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-3 text-gray-700 font-medium">YooKassa</td>
                  <td className="px-4 py-3 text-gray-600">Обработка платежей</td>
                  <td className="px-4 py-3 text-gray-600">Email, сумма, ID подписки (карта НЕ хранится нами)</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-700 font-medium">OpenRouter</td>
                  <td className="px-4 py-3 text-gray-600">AI-сервис (Claude)</td>
                  <td className="px-4 py-3 text-gray-600">Все сообщения чата для генерации ответов</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-700 font-medium">Supabase Auth</td>
                  <td className="px-4 py-3 text-gray-600">Аутентификация</td>
                  <td className="px-4 py-3 text-gray-600">Email, пароль, OAuth данные</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-700 font-medium">Google OAuth</td>
                  <td className="px-4 py-3 text-gray-600">Вход через Google</td>
                  <td className="px-4 py-3 text-gray-600">Имя, email (по выбору пользователя)</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-700 font-medium">HH.ru / Avito.ru / SuperJob.ru</td>
                  <td className="px-4 py-3 text-gray-600">Парсинг вакансий</td>
                  <td className="px-4 py-3 text-gray-600">Никаких пользовательских данных</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-green-50 rounded-xl p-5 border border-green-100">
            <h3 className="font-medium text-green-900 mb-2">Аналитика и трекинг</h3>
            <p className="text-green-700 text-sm">
              Мы НЕ используем аналитические сервисы или трекеры:
            </p>
            <ul className="text-green-700 text-sm mt-2 space-y-1">
              <li>❌ Google Analytics — НЕ используется</li>
              <li>❌ Яндекс.Метрика — НЕ используется</li>
              <li>❌ Рекламные трекеры — НЕ используются</li>
              <li>❌ Facebook Pixel — НЕ используется</li>
            </ul>
          </div>
        </section>

        {/* Section 4: Защита данных */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Хранение и защита данных</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <h3 className="font-medium text-gray-900 mb-3">Меры безопасности</h3>
              <ul className="text-gray-600 text-sm space-y-1">
                <li>✓ Все данные защищены через HTTPS</li>
                <li>✓ Row Level Security (RLS) — пользователи видят только свои данные</li>
                <li>✓ Пароли хешируются (Supabase Auth)</li>
                <li>✓ Сервисные ключи только для бэкенда</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <h3 className="font-medium text-gray-900 mb-3">Хранение данных</h3>
              <ul className="text-gray-600 text-sm space-y-1">
                <li>• Чат-сообщения — хранятся постоянно</li>
                <li>• Профиль и резюме — хранятся постоянно</li>
                <li>• Платёжная история — для финансовых записей</li>
                <li>• Лимиты запросов — обновляются ежедневно</li>
                <li>• Pro Trial — истекает через 3 дня</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 5: Права пользователей */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Ваши права</h2>

          <div className="bg-white rounded-xl p-5 border border-gray-100 mb-4">
            <h3 className="font-medium text-gray-900 mb-3">Вы имеете право:</h3>
            <div className="grid md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-start gap-2 text-gray-600">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Просматривать свои данные в личном кабинете</span>
              </div>
              <div className="flex items-start gap-2 text-gray-600">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Редактировать профиль и резюме в любое время</span>
              </div>
              <div className="flex items-start gap-2 text-gray-600">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Изменять email и пароль</span>
              </div>
              <div className="flex items-start gap-2 text-gray-600">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Удалять свои сообщения из чата</span>
              </div>
              <div className="flex items-start gap-2 text-gray-600">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Отменять подписку Pro в любой момент</span>
              </div>
              <div className="flex items-start gap-2 text-gray-600">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Запрашивать удаление аккаунта (связаться с поддержкой)</span>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-xl p-5 border border-orange-100">
            <h3 className="font-medium text-orange-900 mb-2">Важно знать</h3>
            <p className="text-orange-700 text-sm">
              Следующие данные НЕ удаляются автоматически: чат-история, профиль, история платежей (хранится согласно законодательству РФ).
            </p>
          </div>
        </section>

        {/* Section 6: Дети и подростки */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Дети и подростки</h2>
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <p className="text-gray-600 text-sm">
              Сервис предназначен для пользователей старше 14 лет. Согласно законодательству РФ,
              с 14 лет согласие родителей на обработку персональных данных не требуется.
            </p>
          </div>
        </section>

        {/* Section 7: Изменения */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Изменения в политике</h2>
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <p className="text-gray-600 text-sm mb-3">
              Обновления политики будут публиковаться на этой странице.
              Существенные изменения будут сопровождаться уведомлением через:
            </p>
            <ul className="text-gray-600 text-sm space-y-1">
              <li>• Email (если указан)</li>
              <li>• Уведомление в приложении</li>
            </ul>
          </div>
        </section>

        {/* Section 8: Контакты */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Контакты</h2>
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <p className="text-gray-600 text-sm mb-3">
              Для вопросов по конфиденциальности, удаления аккаунта или отзывов согласия на обработку данных:
            </p>
            <div className="flex flex-col sm:flex-row gap-4 text-sm">
              <a href="mailto:support@example.com" className="text-orange-600 hover:text-orange-700">
                📧 support@example.com
              </a>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">Telegram: @username</span>
            </div>
            <p className="text-gray-400 text-xs mt-3">
              (Замените на реальные контактные данные)
            </p>
          </div>
        </section>

        {/* Back to top */}
        <div className="text-center">
          <a
            href="/privacy"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7h18" />
            </svg>
            Вернуться к началу
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}

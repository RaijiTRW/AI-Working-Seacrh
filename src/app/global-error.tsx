"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Логируем критическую ошибку
    console.error("[Global Error]", error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-gray-50">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-lg w-full">
            {/* Иконка с анимацией */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center">
                  <svg
                    className="w-16 h-16 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                {/* Пульсация */}
                <div className="absolute inset-0 bg-gray-600 rounded-full animate-ping opacity-20" />
              </div>
            </div>

            {/* Заголовок */}
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                Критическая ошибка
              </h1>
              <p className="text-gray-600 mb-8">
                Произошла серьёзная ошибка в приложении. Команда уже уведомлена и работает над решением.
              </p>

              {/* Кнопки действий */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
                <button
                  onClick={reset}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Перезагрузить
                </button>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  На главную
                </Link>
              </div>
            </div>

            {/* Полезные ссылки */}
            <div className="pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center mb-4">Попробуйте перейти к:</p>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/vacancies" className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-colors">
                  <span className="text-lg">💼</span>
                  <span className="text-sm font-medium text-gray-700">Вакансии</span>
                </Link>
                <Link href="/chat" className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-colors">
                  <span className="text-lg">🤖</span>
                  <span className="text-sm font-medium text-gray-700">AI-поиск</span>
                </Link>
                <Link href="/employer" className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-colors">
                  <span className="text-lg">🏢</span>
                  <span className="text-sm font-medium text-gray-700">Работодателям</span>
                </Link>
                <Link href="/account" className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-colors">
                  <span className="text-lg">👤</span>
                  <span className="text-sm font-medium text-gray-700">Аккаунт</span>
                </Link>
              </div>
            </div>

            {/* Отладочная информация (только в разработке) */}
            {process.env.NODE_ENV === "development" && (
              <div className="mt-8 p-4 bg-gray-100 border border-gray-300 rounded-xl">
                <p className="text-xs font-mono text-gray-800 break-words">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs font-mono text-gray-600 mt-2">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}

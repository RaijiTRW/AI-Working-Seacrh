import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        {/* Иконка с анимацией */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-32 h-32 bg-orange-100 rounded-full flex items-center justify-center">
              <svg
                className="w-16 h-16 text-orange-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            {/* Пульсация */}
            <div className="absolute inset-0 bg-orange-200 rounded-full animate-ping opacity-20" />
          </div>
        </div>

        {/* Заголовок */}
        <div className="text-center">
          <h1 className="text-8xl font-bold text-orange-500 mb-4">404</h1>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Страница не найдена
          </h2>
          <p className="text-gray-600 mb-8">
            Кажется, вы забрели не туда. Но это не проблема — мы поможем вернуться!
          </p>

          {/* Кнопки навигации */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              На главную
            </Link>
            <Link
              href="/vacancies"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              К вакансиям
            </Link>
          </div>
        </div>

        {/* Полезные ссылки */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center mb-4">Возможно, вы искали:</p>
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
      </div>
    </div>
  );
}

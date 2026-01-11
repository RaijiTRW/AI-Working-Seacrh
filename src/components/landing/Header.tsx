"use client";

import { useAuth } from "@/lib/useAuth";
import { usePathname } from "next/navigation";

export default function Header() {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="/" className="text-xl font-semibold text-foreground">
          Job AI Search
        </a>

        {/* Center navigation */}
        <nav className="hidden sm:flex items-center gap-6">
          <a
            href="/vacancies"
            className={`text-sm font-medium transition-colors ${
              pathname === "/vacancies"
                ? "text-orange-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Вакансии
          </a>
          <a
            href="/chat"
            className={`text-sm font-medium transition-colors ${
              pathname === "/chat"
                ? "text-orange-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            AI-поиск
          </a>
        </nav>

        {loading ? (
          <div className="w-24 h-10 bg-gray-100 rounded-full animate-pulse" />
        ) : user ? (
          <a
            href="/profile"
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Профиль
          </a>
        ) : (
          <a
            href="/auth"
            className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full text-sm font-medium hover:from-orange-600 hover:to-orange-700 transition-all"
          >
            Войти
          </a>
        )}
      </div>
    </header>
  );
}

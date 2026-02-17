"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { useIsAdmin } from "@/lib/useIsAdmin";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const { user, loading } = useAuth();
  const { isAdmin } = useIsAdmin();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch unread messages count
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const fetchUnread = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const res = await fetch("/api/conversations/unread", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.count || 0);
        }
      } catch (err) {
      }
    };

    fetchUnread();

    // Refetch every 30 seconds
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <a href="/" className="text-xl font-semibold text-foreground">
          Job Search
        </a>

        {/* Center navigation - desktop */}
        <nav className="hidden md:flex items-center gap-6">
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
          <a
            href="/contact"
            className={`text-sm font-medium transition-colors ${
              pathname === "/contact"
                ? "text-orange-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Контакты
          </a>
          {isAdmin ? (
            <a
              href="/employers"
              className={`text-sm font-medium transition-colors ${
                pathname === "/employers"
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Работодателям
            </a>
          ) : (
            <div className="relative inline-block">
              <span
                className="text-sm font-medium text-gray-400 cursor-not-allowed"
                title="Функционал работодателей скоро будет доступен"
              >
                Работодателям
              </span>
              <span className="absolute -top-2 -right-8 px-1.5 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded">
                Скоро
              </span>
            </div>
          )}
        </nav>

        {/* Right side buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {loading ? (
            <div className="w-20 sm:w-24 h-9 sm:h-10 bg-gray-100 rounded-full animate-pulse" />
          ) : user ? (
            <>
              {/* Messages button */}
              <a
                href="/messages"
                className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 min-h-11 rounded-full text-sm font-medium transition-colors ${
                  pathname === "/messages"
                    ? "bg-orange-100 text-orange-600"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="hidden sm:inline">Сообщения</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </a>
              {/* Profile button */}
              <a
                href="/profile"
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 min-h-11 rounded-full text-sm font-medium transition-colors ${
                  pathname === "/profile"
                    ? "bg-orange-100 text-orange-600"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="hidden sm:inline">Профиль</span>
              </a>
            </>
          ) : (
            <a
              href="/auth"
              className="px-4 sm:px-5 py-2.5 min-h-11 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full text-sm font-medium hover:from-orange-600 hover:to-orange-700 transition-all"
            >
              Войти
            </a>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-3 rounded-lg hover:bg-gray-100 transition-colors min-h-11 min-w-11 flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-sm">
          <nav className="max-w-5xl mx-auto px-4 py-3 flex flex-col gap-1">
            <a
              href="/vacancies"
              className={`px-4 py-3 min-h-12 rounded-lg text-sm font-medium transition-colors flex items-center ${
                pathname === "/vacancies"
                  ? "bg-orange-50 text-orange-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Вакансии
            </a>
            <a
              href="/chat"
              className={`px-4 py-3 min-h-12 rounded-lg text-sm font-medium transition-colors flex items-center ${
                pathname === "/chat"
                  ? "bg-orange-50 text-orange-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              AI-поиск
            </a>
            <a
              href="/contact"
              className={`px-4 py-3 min-h-12 rounded-lg text-sm font-medium transition-colors flex items-center ${
                pathname === "/contact"
                  ? "bg-orange-50 text-orange-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Контакты
            </a>
            {isAdmin ? (
              <a
                href="/employers"
                className={`px-4 py-3 min-h-12 rounded-lg text-sm font-medium transition-colors flex items-center ${
                  pathname === "/employers"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Работодателям
              </a>
            ) : (
              <div className="relative px-4 py-3 min-h-12 rounded-lg flex items-center">
                <span className="text-sm font-medium text-gray-400 cursor-not-allowed">
                  Работодателям
                </span>
                <span className="ml-2 px-1.5 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded">
                  Скоро
                </span>
              </div>
            )}
            {user && (
              <>
                <a
                  href="/messages"
                  className={`px-4 py-3 min-h-12 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${
                    pathname === "/messages"
                      ? "bg-orange-50 text-orange-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Сообщения
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </a>
                <a
                  href="/profile"
                  className={`px-4 py-3 min-h-12 rounded-lg text-sm font-medium transition-colors flex items-center ${
                    pathname === "/profile"
                      ? "bg-orange-50 text-orange-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Профиль
                </a>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

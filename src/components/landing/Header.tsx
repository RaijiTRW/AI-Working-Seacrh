"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { useIsAdmin } from "@/lib/useIsAdmin";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";

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
        console.error("Failed to fetch unread count:", err);
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
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(200,200,200,0.3)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)"
      }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <a href="/" className="text-lg sm:text-xl font-semibold text-foreground">
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
              <span
                className="absolute -top-2 -right-8 px-1.5 py-0.5 text-white text-[10px] font-bold rounded"
                style={{
                  background: "linear-gradient(135deg, #f97316, #ea580c)",
                  boxShadow: "0 2px 6px rgba(249,115,22,0.3)"
                }}
              >
                Скоро
              </span>
            </div>
          )}
        </nav>

        {/* Right side buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {loading ? (
            <div
              className="w-20 sm:w-24 h-9 sm:h-10 rounded-full animate-pulse"
              style={{
                background: "linear-gradient(145deg, #f0f0f0, #e0e0e0)",
                boxShadow: "inset 2px 2px 4px rgba(150,150,150,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)"
              }}
            />
          ) : user ? (
            <>
              {/* Messages button - Neumorphic */}
              <motion.a
                href="/messages"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-sm font-medium transition-all ${
                  pathname === "/messages"
                    ? "text-orange-600"
                    : "text-gray-700"
                }`}
                style={{
                  background: pathname === "/messages"
                    ? "linear-gradient(145deg, #fff7ed, #fed7aa)"
                    : "linear-gradient(145deg, #fafafa, #e5e5e5)",
                  boxShadow: pathname === "/messages"
                    ? "4px 4px 10px rgba(200,100,0,0.1), -3px -3px 8px rgba(255,220,180,0.4), inset 0 1px 2px rgba(255,255,255,0.5)"
                    : "4px 4px 10px rgba(150,150,150,0.1), -3px -3px 8px rgba(255,255,255,0.7), inset 0 1px 2px rgba(255,255,255,0.4)"
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="hidden sm:inline">Сообщения</span>
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 text-white text-xs font-medium rounded-full flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #ef4444, #dc2626)",
                      boxShadow: "0 2px 6px rgba(239,68,68,0.4), inset 0 1px 0 rgba(255,255,255,0.3)"
                    }}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </motion.a>
              {/* Profile button - Neumorphic */}
              <motion.a
                href="/profile"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-sm font-medium transition-all ${
                  pathname === "/profile"
                    ? "text-orange-600"
                    : "text-gray-700"
                }`}
                style={{
                  background: pathname === "/profile"
                    ? "linear-gradient(145deg, #fff7ed, #fed7aa)"
                    : "linear-gradient(145deg, #fafafa, #e5e5e5)",
                  boxShadow: pathname === "/profile"
                    ? "4px 4px 10px rgba(200,100,0,0.1), -3px -3px 8px rgba(255,220,180,0.4), inset 0 1px 2px rgba(255,255,255,0.5)"
                    : "4px 4px 10px rgba(150,150,150,0.1), -3px -3px 8px rgba(255,255,255,0.7), inset 0 1px 2px rgba(255,255,255,0.4)"
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="hidden sm:inline">Профиль</span>
              </motion.a>
            </>
          ) : (
            <motion.a
              href="/auth"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm font-medium text-white"
              style={{
                background: "linear-gradient(135deg, #f97316, #ea580c)",
                boxShadow: "6px 6px 14px rgba(200,80,0,0.25), -3px -3px 10px rgba(255,200,150,0.3), inset 0 2px 4px rgba(255,255,255,0.2)"
              }}
            >
              Войти
            </motion.a>
          )}

          {/* Mobile menu button - Neumorphic */}
          <motion.button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            whileTap={{ scale: 0.95 }}
            className="md:hidden p-2.5 rounded-xl"
            style={{
              background: "linear-gradient(145deg, #fafafa, #e5e5e5)",
              boxShadow: "4px 4px 10px rgba(150,150,150,0.12), -3px -3px 8px rgba(255,255,255,0.7)"
            }}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </motion.button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div
          className="md:hidden border-t border-gray-100/50"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))",
            backdropFilter: "blur(12px)"
          }}
        >
          <nav className="max-w-5xl mx-auto px-4 py-3 flex flex-col gap-1">
            <a
              href="/vacancies"
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                pathname === "/vacancies"
                  ? "text-orange-600"
                  : "text-gray-600"
              }`}
              style={{
                background: pathname === "/vacancies"
                  ? "linear-gradient(145deg, #fff7ed, #fed7aa)"
                  : "transparent"
              }}
            >
              Вакансии
            </a>
            <a
              href="/chat"
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                pathname === "/chat"
                  ? "text-orange-600"
                  : "text-gray-600"
              }`}
              style={{
                background: pathname === "/chat"
                  ? "linear-gradient(145deg, #fff7ed, #fed7aa)"
                  : "transparent"
              }}
            >
              AI-поиск
            </a>
            {isAdmin ? (
              <a
                href="/employers"
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  pathname === "/employers"
                    ? "text-blue-600"
                    : "text-gray-600"
                }`}
                style={{
                  background: pathname === "/employers"
                    ? "linear-gradient(145deg, #eff6ff, #dbeafe)"
                    : "transparent"
                }}
              >
                Работодателям
              </a>
            ) : (
              <div className="relative px-4 py-3 rounded-xl">
                <span className="text-sm font-medium text-gray-400 cursor-not-allowed">
                  Работодателям
                </span>
                <span
                  className="ml-2 px-1.5 py-0.5 text-white text-[10px] font-bold rounded"
                  style={{
                    background: "linear-gradient(135deg, #f97316, #ea580c)",
                    boxShadow: "0 2px 6px rgba(249,115,22,0.3)"
                  }}
                >
                  Скоро
                </span>
              </div>
            )}
            {user && (
              <>
                <a
                  href="/messages"
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between ${
                    pathname === "/messages"
                      ? "text-orange-600"
                      : "text-gray-600"
                  }`}
                  style={{
                    background: pathname === "/messages"
                      ? "linear-gradient(145deg, #fff7ed, #fed7aa)"
                      : "transparent"
                  }}
                >
                  Сообщения
                  {unreadCount > 0 && (
                    <span
                      className="px-2 py-0.5 text-white text-xs font-medium rounded-full"
                      style={{
                        background: "linear-gradient(135deg, #ef4444, #dc2626)",
                        boxShadow: "0 2px 6px rgba(239,68,68,0.4)"
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </a>
                <a
                  href="/profile"
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    pathname === "/profile"
                      ? "text-orange-600"
                      : "text-gray-600"
                  }`}
                  style={{
                    background: pathname === "/profile"
                      ? "linear-gradient(145deg, #fff7ed, #fed7aa)"
                      : "transparent"
                  }}
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

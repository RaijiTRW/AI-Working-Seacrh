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

        {/* Center navigation - desktop with Neumorphic pills */}
        <nav className="hidden md:flex items-center gap-3">
          <motion.a
            href="/vacancies"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all relative overflow-hidden ${
              pathname === "/vacancies"
                ? "text-orange-600"
                : "text-gray-600"
            }`}
            style={{
              background: pathname === "/vacancies"
                ? "linear-gradient(145deg, #fff7ed, #ffedd5)"
                : "linear-gradient(145deg, #fafafa, #e5e5e5)",
              boxShadow: pathname === "/vacancies"
                ? "6px 6px 12px rgba(200,100,0,0.15), -6px -6px 12px rgba(255,220,180,0.5), inset 0 1px 2px rgba(255,255,255,0.6)"
                : "4px 4px 10px rgba(150,150,150,0.12), -4px -4px 10px rgba(255,255,255,0.8), inset 0 1px 2px rgba(255,255,255,0.6)"
            }}
          >
            {pathname === "/vacancies" && (
              <div className="absolute top-0 left-2 right-2 h-2 rounded-b-full blur-sm pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.6), transparent)" }} />
            )}
            <span className="relative z-10">Вакансии</span>
          </motion.a>
          <motion.a
            href="/chat"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all relative overflow-hidden ${
              pathname === "/chat"
                ? "text-orange-600"
                : "text-gray-600"
            }`}
            style={{
              background: pathname === "/chat"
                ? "linear-gradient(145deg, #fff7ed, #ffedd5)"
                : "linear-gradient(145deg, #fafafa, #e5e5e5)",
              boxShadow: pathname === "/chat"
                ? "6px 6px 12px rgba(200,100,0,0.15), -6px -6px 12px rgba(255,220,180,0.5), inset 0 1px 2px rgba(255,255,255,0.6)"
                : "4px 4px 10px rgba(150,150,150,0.12), -4px -4px 10px rgba(255,255,255,0.8), inset 0 1px 2px rgba(255,255,255,0.6)"
            }}
          >
            {pathname === "/chat" && (
              <div className="absolute top-0 left-2 right-2 h-2 rounded-b-full blur-sm pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.6), transparent)" }} />
            )}
            <span className="relative z-10">AI-поиск</span>
          </motion.a>
          {isAdmin ? (
            <motion.a
              href="/employers"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all relative overflow-hidden ${
                pathname === "/employers"
                  ? "text-blue-600"
                  : "text-gray-600"
              }`}
              style={{
                background: pathname === "/employers"
                  ? "linear-gradient(145deg, #eff6ff, #dbeafe)"
                  : "linear-gradient(145deg, #fafafa, #e5e5e5)",
                boxShadow: pathname === "/employers"
                  ? "6px 6px 12px rgba(30,80,200,0.15), -6px -6px 12px rgba(100,180,255,0.5), inset 0 1px 2px rgba(255,255,255,0.6)"
                  : "4px 4px 10px rgba(150,150,150,0.12), -4px -4px 10px rgba(255,255,255,0.8), inset 0 1px 2px rgba(255,255,255,0.6)"
              }}
            >
              {pathname === "/employers" && (
                <div className="absolute top-0 left-2 right-2 h-2 rounded-b-full blur-sm pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.6), transparent)" }} />
              )}
              <span className="relative z-10">Работодателям</span>
            </motion.a>
          ) : (
            <div className="relative inline-block">
              <motion.div
                whileHover={{ scale: 1.02, y: -1 }}
                className="px-4 py-2 rounded-full text-sm font-medium text-gray-400 cursor-not-allowed relative overflow-hidden"
                style={{
                  background: "linear-gradient(145deg, #fafafa, #e5e5e5)",
                  boxShadow: "4px 4px 10px rgba(150,150,150,0.12), -4px -4px 10px rgba(255,255,255,0.8), inset 0 1px 2px rgba(255,255,255,0.6)"
                }}
              >
                <span className="relative z-10">Работодателям</span>
              </motion.div>
              <span
                className="absolute -top-2 -right-8 px-1.5 py-0.5 text-white text-[10px] font-bold rounded-full"
                style={{
                  background: "linear-gradient(135deg, #f97316, #ea580c)",
                  boxShadow: "0 4px 10px rgba(249,115,22,0.4), inset 0 1px 0 rgba(255,255,255,0.3)"
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
                boxShadow: "inset 3px 3px 6px rgba(150,150,150,0.15), inset -3px -3px 6px rgba(255,255,255,0.8)"
              }}
            />
          ) : user ? (
            <>
              {/* Messages button - Neumorphic */}
              <motion.a
                href="/messages"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.97 }}
                className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-sm font-medium transition-all overflow-hidden ${
                  pathname === "/messages"
                    ? "text-orange-600"
                    : "text-gray-700"
                }`}
                style={{
                  background: pathname === "/messages"
                    ? "linear-gradient(145deg, #fff7ed, #ffedd5)"
                    : "linear-gradient(145deg, #fafafa, #e5e5e5)",
                  boxShadow: pathname === "/messages"
                    ? "6px 6px 12px rgba(200,100,0,0.18), -6px -6px 12px rgba(255,220,180,0.5), inset 0 1px 2px rgba(255,255,255,0.6)"
                    : "6px 6px 12px rgba(150,150,150,0.12), -6px -6px 12px rgba(255,255,255,0.8), inset 0 1px 2px rgba(255,255,255,0.6)"
                }}
              >
                {pathname === "/messages" && (
                  <div className="absolute top-0 left-2 right-2 h-2 rounded-b-full blur-sm pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.6), transparent)" }} />
                )}
                <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="hidden sm:inline relative z-10">Сообщения</span>
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 text-white text-xs font-medium rounded-full flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #ef4444, #dc2626)",
                      boxShadow: "0 3px 8px rgba(239,68,68,0.5), inset 0 1px 0 rgba(255,255,255,0.3)"
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
                whileTap={{ scale: 0.97 }}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-sm font-medium transition-all overflow-hidden ${
                  pathname === "/profile"
                    ? "text-orange-600"
                    : "text-gray-700"
                }`}
                style={{
                  background: pathname === "/profile"
                    ? "linear-gradient(145deg, #fff7ed, #ffedd5)"
                    : "linear-gradient(145deg, #fafafa, #e5e5e5)",
                  boxShadow: pathname === "/profile"
                    ? "6px 6px 12px rgba(200,100,0,0.18), -6px -6px 12px rgba(255,220,180,0.5), inset 0 1px 2px rgba(255,255,255,0.6)"
                    : "6px 6px 12px rgba(150,150,150,0.12), -6px -6px 12px rgba(255,255,255,0.8), inset 0 1px 2px rgba(255,255,255,0.6)"
                }}
              >
                {pathname === "/profile" && (
                  <div className="absolute top-0 left-2 right-2 h-2 rounded-b-full blur-sm pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.6), transparent)" }} />
                )}
                <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="hidden sm:inline relative z-10">Профиль</span>
              </motion.a>
            </>
          ) : (
            <motion.a
              href="/auth"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm font-medium text-white relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #f97316, #ea580c)",
                boxShadow: "8px 8px 18px rgba(200,80,0,0.3), -5px -5px 14px rgba(255,200,150,0.4), inset 0 2px 4px rgba(255,255,255,0.25)"
              }}
            >
              <div className="absolute top-0 left-3 right-3 h-3 rounded-b-full blur-sm pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.4), transparent)" }} />
              <span className="relative z-10">Войти</span>
            </motion.a>
          )}

          {/* Mobile menu button - Neumorphic */}
          <motion.button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            whileTap={{ scale: 0.93 }}
            className="md:hidden p-2.5 rounded-xl relative overflow-hidden"
            style={{
              background: "linear-gradient(145deg, #fafafa, #e5e5e5)",
              boxShadow: "6px 6px 12px rgba(150,150,150,0.15), -6px -6px 12px rgba(255,255,255,0.8), inset 0 1px 2px rgba(255,255,255,0.6)"
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

      {/* Mobile menu with Soft UI */}
      {mobileMenuOpen && (
        <div
          className="md:hidden border-t relative overflow-hidden"
          style={{
            borderColor: "rgba(200,200,200,0.3)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))",
            backdropFilter: "blur(12px)"
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-1 rounded-b-full blur-sm pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.6), transparent)" }} />
          <nav className="max-w-5xl mx-auto px-4 py-3 flex flex-col gap-2 relative z-10">
            <motion.a
              href="/vacancies"
              whileTap={{ scale: 0.97 }}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-all relative overflow-hidden ${
                pathname === "/vacancies"
                  ? "text-orange-600"
                  : "text-gray-600"
              }`}
              style={{
                background: pathname === "/vacancies"
                  ? "linear-gradient(145deg, #fff7ed, #ffedd5)"
                  : "linear-gradient(145deg, #fafafa, #e5e5e5)",
                boxShadow: pathname === "/vacancies"
                  ? "4px 4px 10px rgba(200,100,0,0.12), -4px -4px 10px rgba(255,220,180,0.4), inset 0 1px 2px rgba(255,255,255,0.5)"
                  : "4px 4px 10px rgba(150,150,150,0.1), -4px -4px 10px rgba(255,255,255,0.7), inset 0 1px 2px rgba(255,255,255,0.5)"
              }}
            >
              {pathname === "/vacancies" && <div className="absolute top-0 left-2 right-2 h-2 rounded-b-full blur-sm pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.6), transparent)" }} />}
              <span className="relative z-10">Вакансии</span>
            </motion.a>
            <motion.a
              href="/chat"
              whileTap={{ scale: 0.97 }}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-all relative overflow-hidden ${
                pathname === "/chat"
                  ? "text-orange-600"
                  : "text-gray-600"
              }`}
              style={{
                background: pathname === "/chat"
                  ? "linear-gradient(145deg, #fff7ed, #ffedd5)"
                  : "linear-gradient(145deg, #fafafa, #e5e5e5)",
                boxShadow: pathname === "/chat"
                  ? "4px 4px 10px rgba(200,100,0,0.12), -4px -4px 10px rgba(255,220,180,0.4), inset 0 1px 2px rgba(255,255,255,0.5)"
                  : "4px 4px 10px rgba(150,150,150,0.1), -4px -4px 10px rgba(255,255,255,0.7), inset 0 1px 2px rgba(255,255,255,0.5)"
              }}
            >
              {pathname === "/chat" && <div className="absolute top-0 left-2 right-2 h-2 rounded-b-full blur-sm pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.6), transparent)" }} />}
              <span className="relative z-10">AI-поиск</span>
            </motion.a>
            {isAdmin ? (
              <motion.a
                href="/employers"
                whileTap={{ scale: 0.97 }}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all relative overflow-hidden ${
                  pathname === "/employers"
                    ? "text-blue-600"
                    : "text-gray-600"
                }`}
                style={{
                  background: pathname === "/employers"
                    ? "linear-gradient(145deg, #eff6ff, #dbeafe)"
                    : "linear-gradient(145deg, #fafafa, #e5e5e5)",
                  boxShadow: pathname === "/employers"
                    ? "4px 4px 10px rgba(30,80,200,0.12), -4px -4px 10px rgba(100,180,255,0.4), inset 0 1px 2px rgba(255,255,255,0.5)"
                    : "4px 4px 10px rgba(150,150,150,0.1), -4px -4px 10px rgba(255,255,255,0.7), inset 0 1px 2px rgba(255,255,255,0.5)"
                }}
              >
                {pathname === "/employers" && <div className="absolute top-0 left-2 right-2 h-2 rounded-b-full blur-sm pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.6), transparent)" }} />}
                <span className="relative z-10">Работодателям</span>
              </motion.a>
            ) : (
              <div className="relative px-4 py-3 rounded-xl" style={{ background: "linear-gradient(145deg, #fafafa, #e5e5e5)", boxShadow: "4px 4px 10px rgba(150,150,150,0.1), -4px -4px 10px rgba(255,255,255,0.7), inset 0 1px 2px rgba(255,255,255,0.5)" }}>
                <span className="text-sm font-medium text-gray-400 cursor-not-allowed">
                  Работодателям
                </span>
                <span
                  className="ml-2 px-1.5 py-0.5 text-white text-[10px] font-bold rounded-full"
                  style={{
                    background: "linear-gradient(135deg, #f97316, #ea580c)",
                    boxShadow: "0 3px 8px rgba(249,115,22,0.4), inset 0 1px 0 rgba(255,255,255,0.3)"
                  }}
                >
                  Скоро
                </span>
              </div>
            )}
            {user && (
              <>
                <motion.a
                  href="/messages"
                  whileTap={{ scale: 0.97 }}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between relative overflow-hidden ${
                    pathname === "/messages"
                      ? "text-orange-600"
                      : "text-gray-600"
                  }`}
                  style={{
                    background: pathname === "/messages"
                      ? "linear-gradient(145deg, #fff7ed, #ffedd5)"
                      : "linear-gradient(145deg, #fafafa, #e5e5e5)",
                    boxShadow: pathname === "/messages"
                      ? "4px 4px 10px rgba(200,100,0,0.12), -4px -4px 10px rgba(255,220,180,0.4), inset 0 1px 2px rgba(255,255,255,0.5)"
                      : "4px 4px 10px rgba(150,150,150,0.1), -4px -4px 10px rgba(255,255,255,0.7), inset 0 1px 2px rgba(255,255,255,0.5)"
                  }}
                >
                  {pathname === "/messages" && <div className="absolute top-0 left-2 right-2 h-2 rounded-b-full blur-sm pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.6), transparent)" }} />}
                  <span className="relative z-10">Сообщения</span>
                  {unreadCount > 0 && (
                    <span
                      className="px-2 py-0.5 text-white text-xs font-medium rounded-full"
                      style={{
                        background: "linear-gradient(135deg, #ef4444, #dc2626)",
                        boxShadow: "0 3px 8px rgba(239,68,68,0.5)"
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </motion.a>
                <motion.a
                  href="/profile"
                  whileTap={{ scale: 0.97 }}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all relative overflow-hidden ${
                    pathname === "/profile"
                      ? "text-orange-600"
                      : "text-gray-600"
                  }`}
                  style={{
                    background: pathname === "/profile"
                      ? "linear-gradient(145deg, #fff7ed, #ffedd5)"
                      : "linear-gradient(145deg, #fafafa, #e5e5e5)",
                    boxShadow: pathname === "/profile"
                      ? "4px 4px 10px rgba(200,100,0,0.12), -4px -4px 10px rgba(255,220,180,0.4), inset 0 1px 2px rgba(255,255,255,0.5)"
                      : "4px 4px 10px rgba(150,150,150,0.1), -4px -4px 10px rgba(255,255,255,0.7), inset 0 1px 2px rgba(255,255,255,0.5)"
                  }}
                >
                  {pathname === "/profile" && <div className="absolute top-0 left-2 right-2 h-2 rounded-b-full blur-sm pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.6), transparent)" }} />}
                  <span className="relative z-10">Профиль</span>
                </motion.a>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

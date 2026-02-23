"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { useIsAdmin } from "@/lib/useIsAdmin";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

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

    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: "/vacancies", label: "Вакансии" },
    { href: "/chat", label: "AI-поиск" },
    { href: "/contact", label: "Контакты" },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed top-0 left-0 right-0 z-50 bg-[#0b0c10]/80 backdrop-blur-md border-b border-[#1f2833]"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <a href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-[#c5c6c7] hover:from-[#00f0ff] hover:to-[#00f0ff] transition-all">
          Job<span className="text-[#ff6b00]">AI</span>Search
        </a>

        {/* Center navigation - desktop */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-all duration-300 relative ${pathname === link.href
                  ? "text-[#ff6b00] drop-shadow-[0_0_8px_rgba(255,107,0,0.5)]"
                  : "text-[#c5c6c7] hover:text-[#00f0ff] hover:drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]"
                }`}
            >
              {link.label}
              {pathname === link.href && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#ff6b00] rounded-full"
                />
              )}
            </a>
          ))}

          {isAdmin ? (
            <a
              href="/employers"
              className={`text-sm font-medium transition-all duration-300 relative ${pathname === "/employers"
                  ? "text-[#00f0ff] drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]"
                  : "text-[#c5c6c7] hover:text-[#00f0ff] hover:drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]"
                }`}
            >
              Работодателям
              {pathname === "/employers" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#00f0ff] rounded-full"
                />
              )}
            </a>
          ) : (
            <div className="relative inline-block">
              <span className="text-sm font-medium text-gray-600 cursor-not-allowed">
                Работодателям
              </span>
              <span className="absolute -top-3 -right-6 px-1.5 py-0.5 bg-[#1f2833] border border-[#ff6b00]/30 text-[#ff6b00] text-[10px] font-bold rounded-sm shadow-[0_0_10px_rgba(255,107,0,0.2)]">
                Скоро
              </span>
            </div>
          )}
        </nav>

        {/* Right side buttons */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-20 sm:w-24 h-9 sm:h-10 bg-[#1f2833] rounded-full animate-pulse" />
          ) : user ? (
            <>
              {/* Messages button */}
              <a
                href="/messages"
                className={`relative flex items-center gap-2 px-4 py-2 min-h-10 rounded-full text-sm font-medium transition-all duration-300 ${pathname === "/messages"
                    ? "bg-[#ff6b00]/10 text-[#ff6b00] border border-[#ff6b00]/50"
                    : "bg-[#1f2833] text-[#c5c6c7] hover:bg-[#1f2833]/80 hover:text-white border border-transparent hover:border-[#00f0ff]/30"
                  }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="hidden sm:inline">Сообщения</span>
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 bg-[#ff6b00] text-white text-xs font-bold rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(255,107,0,0.5)]"
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </motion.span>
                )}
              </a>
              {/* Profile button */}
              <a
                href="/profile"
                className={`flex items-center gap-2 px-4 py-2 min-h-10 rounded-full text-sm font-medium transition-all duration-300 ${pathname === "/profile"
                    ? "bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/50"
                    : "bg-[#1f2833] text-[#c5c6c7] hover:bg-[#1f2833]/80 hover:text-white border border-transparent hover:border-[#00f0ff]/30"
                  }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="hidden sm:inline">Профиль</span>
              </a>
            </>
          ) : (
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="/auth"
              className="px-6 py-2 min-h-10 bg-[#ff6b00] text-white rounded-full text-sm font-bold shadow-[0_0_15px_rgba(255,107,0,0.4)] hover:shadow-[0_0_25px_rgba(255,107,0,0.6)] hover:bg-[#ff8c00] transition-all"
            >
              Войти
            </motion.a>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2.5 rounded-lg bg-[#1f2833] text-[#c5c6c7] hover:text-white hover:border-[#00f0ff]/30 border border-transparent transition-all min-h-10 min-w-10 flex items-center justify-center"
          >
            <AnimatePresence mode="wait">
              {mobileMenuOpen ? (
                <motion.svg
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </motion.svg>
              ) : (
                <motion.svg
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </motion.svg>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden border-t border-[#1f2833] bg-[#0b0c10]/95 backdrop-blur-md"
          >
            <nav className="max-w-5xl mx-auto px-4 py-4 flex flex-col gap-2">
              {[...navLinks, ...(isAdmin ? [{ href: "/employers", label: "Работодателям", isSpecial: true }] : [])].map((link, i) => (
                <motion.a
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  href={link.href}
                  className={`px-4 py-3 min-h-12 rounded-lg text-sm font-medium transition-colors flex items-center ${pathname === link.href
                      ? "bg-[#ff6b00]/10 text-[#ff6b00] border border-[#ff6b00]/20"
                      : "text-[#c5c6c7] hover:bg-[#1f2833] hover:text-white"
                    }`}
                >
                  {link.label}
                </motion.a>
              ))}

              {!isAdmin && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navLinks.length * 0.1 }}
                  className="relative px-4 py-3 min-h-12 rounded-lg flex items-center bg-[#1f2833]/50"
                >
                  <span className="text-sm font-medium text-gray-600">
                    Работодателям
                  </span>
                  <span className="ml-auto px-2 py-1 bg-[#1f2833] border border-[#ff6b00]/30 text-[#ff6b00] text-[10px] font-bold rounded-sm shadow-[0_0_10px_rgba(255,107,0,0.2)]">
                    Скоро
                  </span>
                </motion.div>
              )}

              {user && (
                <div className="mt-2 pt-2 border-t border-[#1f2833] flex flex-col gap-2">
                  <motion.a
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    href="/messages"
                    className={`px-4 py-3 min-h-12 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${pathname === "/messages"
                        ? "bg-[#ff6b00]/10 text-[#ff6b00] border border-[#ff6b00]/20"
                        : "text-[#c5c6c7] hover:bg-[#1f2833] hover:text-white"
                      }`}
                  >
                    Сообщения
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 bg-[#ff6b00] text-white text-xs font-bold rounded-full shadow-[0_0_10px_rgba(255,107,0,0.5)]">
                        {unreadCount}
                      </span>
                    )}
                  </motion.a>
                  <motion.a
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    href="/profile"
                    className={`px-4 py-3 min-h-12 rounded-lg text-sm font-medium transition-colors flex items-center ${pathname === "/profile"
                        ? "bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20"
                        : "text-[#c5c6c7] hover:bg-[#1f2833] hover:text-white"
                      }`}
                  >
                    Профиль
                  </motion.a>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import { useIsAdmin } from "@/lib/useIsAdmin";
import { supabase } from "@/lib/supabase";

interface AppHeaderProps {
  showRequestCounter?: boolean;
  hideOnMobile?: boolean;
}

export default function AppHeader({ showRequestCounter = false, hideOnMobile = false }: AppHeaderProps) {
  const { user, loading } = useAuth();
  const { isAdmin } = useIsAdmin();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const isActive = (path: string) => {
    if (path === "/" && pathname !== "/") return false;
    return pathname === path || pathname?.startsWith(path + "/");
  };

  const getActiveClass = (path: string) => {
    if (isActive(path)) {
      return "text-[#ff6b00] drop-shadow-[0_0_8px_rgba(255,107,0,0.4)]";
    }
    return "text-[#c5c6c7]/80 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]";
  };

  // Показываем раздел "Работодателем" на лендинге и странице контактов
  const isLandingPage = pathname === "/" || pathname === "/contact" || pathname?.startsWith("/?");

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${hideOnMobile ? "hidden lg:block" : ""} ${scrolled ? "bg-[#0b0c10]/90 backdrop-blur-xl border-b border-[#c5c6c7]/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] py-2 sm:py-3" : "bg-transparent py-4 sm:py-5"
        }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        <Link href="/" className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] drop-shadow-[0_0_10px_rgba(255,107,0,0.4)] tracking-wide flex items-center gap-2">
          <div className="relative w-7 h-7 flex items-center justify-center">
            <div className="absolute inset-0 bg-[#ff6b00]/20 rounded-lg blur-md" />
            <svg className="w-5 h-5 text-[#ff6b00] relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          JobSearch
        </Link>

        {/* Center navigation - desktop */}
        <nav className="hidden lg:flex items-center gap-8 bg-[#1f2833]/40 backdrop-blur-md px-6 py-2.5 rounded-full border border-[#c5c6c7]/10 shadow-inner">
          <Link
            href="/vacancies"
            className={`text-[13px] font-bold uppercase tracking-widest transition-all ${getActiveClass("/vacancies")}`}
          >
            Вакансии
          </Link>
          <Link
            href="/chat"
            className={`text-[13px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 ${getActiveClass("/chat")}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-pulse shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
            AI-поиск
          </Link>
          <Link
            href="/resume-builder"
            className={`text-[13px] font-bold uppercase tracking-widest transition-all ${getActiveClass("/resume-builder")}`}
          >
            Резюме
          </Link>
          {isLandingPage && (
            <>
              <Link
                href="/contact"
                className={`text-[13px] font-bold uppercase tracking-widest transition-all ${getActiveClass("/contact")}`}
              >
                Контакты
              </Link>
              {isAdmin ? (
                <Link
                  href="/employers"
                  className={`text-[13px] font-bold uppercase tracking-widest transition-all ${isActive("/employers") ? "text-[#00f0ff] drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]" : "text-[#c5c6c7]/80 hover:text-white"}`}
                >
                  Работодателям
                </Link>
              ) : (
                <div className="relative inline-block group">
                  <span
                    className="text-[13px] font-bold uppercase tracking-widest text-[#c5c6c7]/40 cursor-not-allowed group-hover:text-[#c5c6c7]/60 transition-colors"
                  >
                    Работодателям
                  </span>
                  <span className="absolute -top-2.5 -right-6 px-1.5 py-0.5 bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] text-[9px] font-black uppercase tracking-widest rounded shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                    Скоро
                  </span>
                </div>
              )}
            </>
          )}
        </nav>

        {/* Right side buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {loading ? (
            <div className="w-24 h-11 bg-[#1f2833]/50 rounded-full animate-pulse border border-[#c5c6c7]/5" />
          ) : user ? (
            <>
              {/* Messages button */}
              <Link
                href="/messages"
                className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 min-h-[44px] rounded-full text-xs font-bold uppercase tracking-widest transition-all border ${isActive("/messages")
                    ? "bg-[#ff6b00]/10 text-[#ff6b00] border-[#ff6b00]/30 shadow-[0_0_15px_rgba(255,107,0,0.2)]"
                    : "bg-[#1f2833]/60 text-[#c5c6c7]/80 border-[#c5c6c7]/10 hover:bg-[#1f2833] hover:text-white"
                  }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="hidden sm:inline">Inbox</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-[#ff6b00] text-[#0b0c10] text-[10px] font-black rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(255,107,0,0.6)] border border-[#0b0c10]">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>

              {/* Profile button */}
              <Link
                href="/profile"
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 min-h-[44px] rounded-full text-xs font-bold uppercase tracking-widest transition-all border ${isActive("/profile") || isActive("/admin") || isActive("/subscription")
                    ? "bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]/30 shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                    : "bg-[#1f2833]/60 text-[#c5c6c7]/80 border-[#c5c6c7]/10 hover:bg-[#1f2833] hover:text-white"
                  }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="hidden sm:inline">
                  {isActive("/admin") ? "Админ" : isActive("/subscription") ? "Подписка" : "Профиль"}
                </span>
              </Link>
            </>
          ) : (
            <Link
              href="/auth"
              className="px-6 py-2 min-h-[44px] bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] text-[#0b0c10] rounded-full text-xs font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(255,107,0,0.4)] transition-all hover:scale-[1.02] flex items-center justify-center drop-shadow-md"
            >
              Войти
            </Link>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`lg:hidden p-2.5 rounded-xl border transition-all flex items-center justify-center ${mobileMenuOpen
                ? "bg-[#ff6b00]/10 border-[#ff6b00]/30 text-[#ff6b00]"
                : "bg-[#1f2833]/60 border-[#c5c6c7]/10 text-[#c5c6c7]/80 hover:text-white"
              }`}
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
        <div className="lg:hidden absolute top-full left-0 right-0 border-b border-[#c5c6c7]/10 bg-[#0b0c10]/95 backdrop-blur-xl shadow-[0_20px_40px_rgba(0,0,0,0.8)] animate-in slide-in-from-top-2 duration-200">
          <nav className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-2">
            <Link
              href="/vacancies"
              className={`px-5 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center border ${isActive("/vacancies")
                  ? "bg-[#ff6b00]/10 border-[#ff6b00]/30 text-[#ff6b00] shadow-[0_0_15px_rgba(255,107,0,0.1)]"
                  : "bg-[#1f2833]/40 border-transparent text-[#c5c6c7]/80 hover:bg-[#1f2833] hover:text-white"
                }`}
            >
              Вакансии
            </Link>
            <Link
              href="/chat"
              className={`px-5 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-3 border ${isActive("/chat")
                  ? "bg-[#00f0ff]/10 border-[#00f0ff]/30 text-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.1)]"
                  : "bg-[#1f2833]/40 border-transparent text-[#c5c6c7]/80 hover:bg-[#1f2833] hover:text-white"
                }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isActive("/chat") ? "bg-[#00f0ff] animate-pulse shadow-[0_0_8px_rgba(0,240,255,0.8)]" : "bg-[#c5c6c7]/50"}`} />
              AI-поиск
            </Link>
            <Link
              href="/resume-builder"
              className={`px-5 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center border ${isActive("/resume-builder")
                  ? "bg-[#ff6b00]/10 border-[#ff6b00]/30 text-[#ff6b00] shadow-[0_0_15px_rgba(255,107,0,0.1)]"
                  : "bg-[#1f2833]/40 border-transparent text-[#c5c6c7]/80 hover:bg-[#1f2833] hover:text-white"
                }`}
            >
              Конструктор резюме
            </Link>
            {isLandingPage && (
              <>
                <Link
                  href="/contact"
                  className={`px-5 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center border ${isActive("/contact")
                      ? "bg-[#ff6b00]/10 border-[#ff6b00]/30 text-[#ff6b00] shadow-[0_0_15px_rgba(255,107,0,0.1)]"
                      : "bg-[#1f2833]/40 border-transparent text-[#c5c6c7]/80 hover:bg-[#1f2833] hover:text-white"
                    }`}
                >
                  Контакты
                </Link>
                {isAdmin ? (
                  <Link
                    href="/employers"
                    className={`px-5 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center border ${isActive("/employers")
                        ? "bg-[#00f0ff]/10 border-[#00f0ff]/30 text-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.1)]"
                        : "bg-[#1f2833]/40 border-transparent text-[#c5c6c7]/80 hover:bg-[#1f2833] hover:text-white"
                      }`}
                  >
                    Работодателям
                  </Link>
                ) : (
                  <div className="relative px-5 py-3.5 rounded-xl flex items-center justify-between bg-[#1f2833]/20 border border-[#c5c6c7]/5">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#c5c6c7]/40 cursor-not-allowed">
                      Работодателям
                    </span>
                    <span className="px-2 py-1 bg-[#00f0ff]/10 border border-[#00f0ff]/20 text-[#00f0ff] text-[9px] font-black uppercase tracking-widest rounded shadow-[0_0_10px_rgba(0,240,255,0.1)]">
                      Скоро
                    </span>
                  </div>
                )}
              </>
            )}

            {user && (
              <div className="mt-2 pt-2 border-t border-[#c5c6c7]/10 space-y-2">
                <Link
                  href="/messages"
                  className={`px-5 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-between border ${isActive("/messages")
                      ? "bg-[#ff6b00]/10 border-[#ff6b00]/30 text-[#ff6b00] shadow-[0_0_15px_rgba(255,107,0,0.1)]"
                      : "bg-[#1f2833]/40 border-transparent text-[#c5c6c7]/80 hover:bg-[#1f2833] hover:text-white"
                    }`}
                >
                  <span>Сообщения</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-[#ff6b00] text-[#0b0c10] text-[10px] font-black rounded-full shadow-[0_0_10px_rgba(255,107,0,0.4)]">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/profile"
                  className={`px-5 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center border ${isActive("/profile") || isActive("/admin") || isActive("/subscription")
                      ? "bg-[#00f0ff]/10 border-[#00f0ff]/30 text-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.1)]"
                      : "bg-[#1f2833]/40 border-transparent text-[#c5c6c7]/80 hover:bg-[#1f2833] hover:text-white"
                    }`}
                >
                  {isActive("/admin") ? "Админ-панель" : isActive("/subscription") ? "Подписка" : "Профиль"}
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

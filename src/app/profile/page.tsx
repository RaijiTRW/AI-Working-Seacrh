"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { checkIsAdmin } from "@/lib/api";
import ProfileSection from "@/components/profile/ProfileSection";
import ResumeSection from "@/components/profile/ResumeSection";
import SecuritySection from "@/components/profile/SecuritySection";
import AccountsSection from "@/components/profile/AccountsSection";
import SubscriptionSection from "@/components/profile/SubscriptionSection";
import AppHeader from "@/components/app/Header";

type Tab = "profile" | "resume" | "subscription" | "security" | "accounts";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [isAdmin, setIsAdmin] = useState(false);
  const [version, setVersion] = useState<string | null>(null);

  // Read tab from URL query param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam && ["profile", "resume", "subscription", "security", "accounts"].includes(tabParam)) {
      setActiveTab(tabParam as Tab);
    }
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/auth");
      } else {
        setUser({ id: session.user.id, email: session.user.email });
        const adminStatus = await checkIsAdmin(session.access_token);
        setIsAdmin(adminStatus);
      }
      setLoading(false);
    };
    checkUser();

    // Загрузка версии (с cache-busting)
    fetch("/api/version", { cache: "no-store" })
      .then(res => res.json())
      .then(data => setVersion(data.version))
      .catch(() => setVersion("unknown"));
  }, [router]);

  const handleLogout = async () => {
    // Не удаляем связанные аккаунты при выходе - они должны сохраняться
    // чтобы при следующем входе пользователь видел свои связи
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0c10]">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 pointer-events-none" />
        <div className="animate-spin w-12 h-12 border-4 border-[#ff6b00] border-t-transparent rounded-full shadow-[0_0_15px_rgba(255,107,0,0.5)] z-10" />
      </div>
    );
  }

  const tabs = [
    { id: "profile" as Tab, label: "Личные данные", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
    { id: "resume" as Tab, label: "Резюме", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    { id: "subscription" as Tab, label: "Подписка", icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" },
    { id: "security" as Tab, label: "Безопасность", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
    // { id: "accounts" as Tab, label: "Аккаунты", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
  ];

  return (
    <div className="min-h-screen bg-[#0b0c10] relative text-gray-200">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 pointer-events-none" />

      {/* Universal Header */}
      <AppHeader />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8 pt-20 sm:pt-24 relative z-10">
        {/* Page title */}
        <div className="mb-6 sm:mb-10 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Настройки профиля</h1>
          <p className="text-sm sm:text-base text-gray-400 mt-2">Управляйте своим аккаунтом, резюме и подпиской</p>
        </div>

        <div className="md:hidden mb-6 -mx-4 px-4 overflow-x-auto custom-scrollbar">
          <div className="flex gap-2 pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${activeTab === tab.id
                  ? "bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] text-white shadow-[0_0_15px_rgba(255,107,0,0.3)] border border-transparent"
                  : "bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap bg-white/5 text-[#00f0ff] border border-[rgba(0,240,255,0.2)] hover:shadow-[0_0_15px_rgba(0,240,255,0.2)] transition-all duration-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Админ
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap bg-white/5 text-red-400 border border-red-500/20 hover:bg-red-500/10 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Выйти
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar - desktop only */}
          <nav className="hidden md:block w-64 shrink-0">
            <div className="sticky top-24 bg-[#1f2833]/50 backdrop-blur-xl rounded-2xl border border-white/10 p-3 shadow-xl">
              <div className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300 ${activeTab === tab.id
                      ? "bg-gradient-to-r from-[#ff6b00]/20 to-[#ff8c00]/10 text-white border border-[#ff6b00]/30 shadow-[inset_0_0_20px_rgba(255,107,0,0.15)]"
                      : "text-gray-400 hover:bg-white/5 hover:text-white border border-transparent"
                      }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                    </svg>
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                ))}

              </div>

              {/* Admin Link */}
              {isAdmin && (
                <div className="border-t border-white/10 mt-3 pt-3">
                  <Link
                    href="/admin"
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-[#00f0ff] hover:bg-[#00f0ff]/10 hover:shadow-[0_0_15px_rgba(0,240,255,0.1)] transition-all border border-transparent hover:border-[#00f0ff]/20"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    <span className="text-sm font-medium">Админ-панель</span>
                  </Link>
                </div>
              )}

              {/* Logout */}
              <div className="border-t border-white/10 mt-3 pt-3">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-red-500 hover:bg-red-500/10 hover:shadow-[0_0_15px_rgba(239,68,68,0.1)] transition-all border border-transparent hover:border-red-500/20"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="text-sm font-medium">Выйти</span>
                </button>
              </div>

              {/* Version */}
              {version && (
                <div className="border-t border-white/10 mt-3 pt-4 pb-1 px-4">
                  <p className="text-xs text-gray-500 text-center font-mono">
                    v{version}-beta
                  </p>
                </div>
              )}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {activeTab === "profile" && <ProfileSection userId={user?.id || ""} email={user?.email} />}
            {activeTab === "resume" && <ResumeSection userId={user?.id || ""} />}
            {activeTab === "subscription" && <SubscriptionSection />}
            {activeTab === "security" && <SecuritySection userEmail={user?.email || ""} />}
            {/* {activeTab === "accounts" && <AccountsSection currentEmail={user?.email || ""} onLogout={handleLogout} />} */}
          </div>
        </div>
      </main>
    </div>
  );
}

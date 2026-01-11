"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ProfileSection from "@/components/profile/ProfileSection";
import ResumeSection from "@/components/profile/ResumeSection";
import SecuritySection from "@/components/profile/SecuritySection";
import AccountsSection from "@/components/profile/AccountsSection";

type Tab = "profile" | "resume" | "security" | "accounts";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
      } else {
        setUser({ id: user.id, email: user.email });
      }
      setLoading(false);
    };
    checkUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const tabs = [
    { id: "profile" as Tab, label: "Личные данные", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
    { id: "resume" as Tab, label: "Резюме", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    { id: "security" as Tab, label: "Безопасность", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
    { id: "accounts" as Tab, label: "Аккаунты", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Job AI Search
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/chat"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Чат
            </Link>
            <span className="text-sm font-medium text-orange-600">Профиль</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Настройки профиля</h1>
          <p className="text-gray-500 mt-1">Управляйте своим аккаунтом и резюме</p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <nav className="w-56 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-200 p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                    activeTab === tab.id
                      ? "bg-orange-50 text-orange-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              ))}

              {/* Logout */}
              <div className="border-t border-gray-100 mt-2 pt-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-red-500 hover:bg-red-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="text-sm font-medium">Выйти</span>
                </button>
              </div>
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1">
            {activeTab === "profile" && <ProfileSection userId={user?.id || ""} email={user?.email} />}
            {activeTab === "resume" && <ResumeSection userId={user?.id || ""} />}
            {activeTab === "security" && <SecuritySection userEmail={user?.email || ""} />}
            {activeTab === "accounts" && <AccountsSection currentEmail={user?.email || ""} onLogout={handleLogout} />}
          </div>
        </div>
      </main>
    </div>
  );
}

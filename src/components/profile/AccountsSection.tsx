"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface AccountsSectionProps {
  currentEmail: string;
  onLogout: () => void;
}

export default function AccountsSection({ currentEmail, onLogout }: AccountsSectionProps) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleAddAccount = async () => {
    if (!email || !password) {
      setMessage({ type: "error", text: "Заполните все поля" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Sign out current user
      await supabase.auth.signOut();

      // Sign in with new account
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Redirect to chat
      router.push("/chat");
    } catch (err) {
      setMessage({ type: "error", text: "Ошибка входа. Проверьте данные." });
      // Sign back in if failed (optional - user can manually login)
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await supabase.auth.signOut();
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/chat`,
        },
      });
    } catch (err) {
      setMessage({ type: "error", text: "Ошибка входа через Google" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Current account */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Текущий аккаунт</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 font-semibold">
                {currentEmail[0].toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{currentEmail}</p>
              <p className="text-sm text-gray-500">Активный</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            Выйти
          </button>
        </div>
      </div>

      {/* Add account */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Добавить аккаунт</h2>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              + Добавить
            </button>
          )}
        </div>

        {showAddForm ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Войдите в другой аккаунт. Текущая сессия будет завершена.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Почта</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="example@mail.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="••••••••"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAddAccount}
                disabled={loading}
                className="px-6 py-2 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {loading ? "Вход..." : "Войти"}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEmail("");
                  setPassword("");
                  setMessage(null);
                }}
                className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Отмена
              </button>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">или</span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Войти через Google
            </button>
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-4">
            Нажмите "Добавить" чтобы войти в другой аккаунт
          </p>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-xl text-sm ${
          message.type === "success" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
}

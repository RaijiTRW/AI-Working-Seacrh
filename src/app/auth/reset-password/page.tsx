"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ArrowLeft } from "lucide-react";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Проверка наличия токена сброса в URL
  useEffect(() => {
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");

    if (!accessToken || !refreshToken) {
      setError("Неверная ссылка сброса пароля");
    } else {
      // Устанавливаем сессию из токенов в URL
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Пароль должен быть не менее 6 символов");
      return;
    }

    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      // Успешно - перенаправляем на вход
      router.push("/auth?reset=success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сброса пароля");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center min-h-screen bg-[#0b0c10] p-8 lg:p-12 relative">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 pointer-events-none" />
      <div className="max-w-sm mx-auto w-full relative z-10">
        {/* Logo */}
        <Link href="/auth" className="inline-block mb-8 hover:opacity-80 transition-opacity">
          <span className="text-xl font-bold text-white flex items-center gap-2">
            <ArrowLeft size={20} /> Job Search
          </span>
        </Link>

        <h2 className="text-2xl font-bold text-white mb-2">
          Новый пароль
        </h2>
        <p className="text-gray-400 mb-8">
          Придумайте новый пароль для аккаунта
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
              Новый пароль
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Минимум 6 символов"
                required
                minLength={6}
                className="w-full px-4 py-3 pr-12 bg-black/20 text-white placeholder-gray-500 rounded-xl border border-white/10 focus:border-[#ff6b00] focus:ring-1 focus:ring-[#ff6b00] outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1.5">
              Подтвердите пароль
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Повторите пароль"
              required
              className="w-full px-4 py-3 bg-black/20 text-white placeholder-gray-500 rounded-xl border border-white/10 focus:border-[#ff6b00] focus:ring-1 focus:ring-[#ff6b00] outline-none transition-all"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || password.length < 6 || password !== confirmPassword}
            className="w-full py-3 bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] text-white rounded-xl font-medium hover:shadow-[0_0_15px_rgba(255,107,0,0.4)] transition-all duration-300 disabled:opacity-50 disabled:hover:shadow-none disabled:cursor-not-allowed"
          >
            {loading ? "Сохранение..." : "Сохранить пароль"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Вспомнили пароль?{" "}
          <Link href="/auth" className="text-[#ff6b00] hover:text-[#ff8c00] font-medium transition-colors">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-full">Загрузка...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

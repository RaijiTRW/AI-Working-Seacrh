"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, CheckCircle } from "lucide-react";

function EmailChangeConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    const confirmEmailChange = async () => {
      try {
        // Supabase автоматически обрабатывает токен из URL
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session) {
          // Если нет сессии, пробуем получить из URL параметров
          const accessToken = searchParams.get("access_token");
          const refreshToken = searchParams.get("refresh_token");

          if (accessToken && refreshToken) {
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (setSessionError) throw setSessionError;

            // Получаем обновлённые данные пользователя
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
              setNewEmail(user.email);
            }
          } else {
            throw new Error("Не удалось подтвердить смену email");
          }
        } else {
          // Сессия есть, получаем email пользователя
          if (session.user?.email) {
            setNewEmail(session.user.email);
          }
        }

        setLoading(false);
      } catch (err: any) {
        setError(err?.message || "Ошибка подтверждения смены email");
        setLoading(false);
      }
    };

    confirmEmailChange();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center min-h-screen bg-[#0b0c10] p-8 lg:p-12 relative">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 pointer-events-none" />
        <div className="max-w-sm mx-auto w-full text-center relative z-10">
          <div className="animate-spin w-8 h-8 border-4 border-[#ff6b00] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Подтверждение смены email...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center min-h-screen bg-[#0b0c10] p-8 lg:p-12 relative">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 pointer-events-none" />
        <div className="max-w-sm mx-auto w-full text-center relative z-10">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Ошибка</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link
            href="/profile"
            className="inline-block px-6 py-2 bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] text-white font-medium rounded-xl hover:shadow-[0_0_15px_rgba(255,107,0,0.4)] transition-all duration-300"
          >
            Вернуться в профиль
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center min-h-screen bg-[#0b0c10] p-8 lg:p-12 relative">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 pointer-events-none" />
      <div className="max-w-sm mx-auto w-full text-center relative z-10">
        <div className="w-16 h-16 bg-[#00ff88]/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(0,255,136,0.2)]">
          <CheckCircle className="w-8 h-8 text-[#00ff88]" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">
          Email успешно изменён!
        </h2>

        <p className="text-gray-400 mb-2">
          Теперь вы можете входить с помощью:
        </p>

        <p className="text-lg font-medium text-[#ff6b00] mb-6 drop-shadow-[0_0_8px_rgba(255,107,0,0.3)]">
          {newEmail}
        </p>

        <Link
          href="/profile"
          className="inline-block px-6 py-3 bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] text-white font-medium rounded-xl hover:shadow-[0_0_15px_rgba(255,107,0,0.4)] transition-all duration-300"
        >
          Вернуться в профиль
        </Link>
      </div>
    </div>
  );
}

export default function EmailChangeConfirmationPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-full">Загрузка...</div>}>
      <EmailChangeConfirmationContent />
    </Suspense>
  );
}

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
        console.error("Email change confirmation error:", err);
        setError(err?.message || "Ошибка подтверждения смены email");
        setLoading(false);
      }
    };

    confirmEmailChange();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center h-full p-8 lg:p-12">
        <div className="max-w-sm mx-auto w-full text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Подтверждение смены email...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center h-full p-8 lg:p-12">
        <div className="max-w-sm mx-auto w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ошибка</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/profile"
            className="inline-block px-6 py-2 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors"
          >
            Вернуться в профиль
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center h-full p-8 lg:p-12">
      <div className="max-w-sm mx-auto w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Email успешно изменён!
        </h2>

        <p className="text-gray-600 mb-2">
          Теперь вы можете входить с помощью:
        </p>

        <p className="text-lg font-medium text-orange-600 mb-6">
          {newEmail}
        </p>

        <Link
          href="/profile"
          className="inline-block px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all"
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

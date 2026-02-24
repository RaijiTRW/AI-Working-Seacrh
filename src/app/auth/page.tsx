import { Suspense } from "react";
import AuthHero from "@/components/auth/AuthHero";
import AuthForm from "@/components/auth/AuthForm";

export const metadata = {
  title: "Вход | Поиск работы",
  description: "Войди или создай аккаунт для поиска работы",
};

export default function AuthPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#0b0c10]">
      {/* Left side - Hero (hidden on mobile) */}
      <AuthHero />

      {/* Right side - Form */}
      <div className="bg-[#0b0c10] lg:bg-[#1f2833]/30 flex items-center justify-center px-4 py-8 sm:px-6 sm:py-12 lg:border-l lg:border-white/5 relative z-10">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 pointer-events-none" />
        <Suspense fallback={<div className="text-center text-gray-400">Загрузка...</div>}>
          <AuthForm />
        </Suspense>
      </div>
    </div>
  );
}

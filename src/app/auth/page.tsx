import { Suspense } from "react";
import AuthHero from "@/components/auth/AuthHero";
import AuthForm from "@/components/auth/AuthForm";

export const metadata = {
  title: "Вход | Поиск работы",
  description: "Войди или создай аккаунт для поиска работы",
};

export default function AuthPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Hero (hidden on mobile) */}
      <AuthHero />

      {/* Right side - Form */}
      <div className="bg-white flex items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <Suspense fallback={<div className="text-center">Загрузка...</div>}>
          <AuthForm />
        </Suspense>
      </div>
    </div>
  );
}

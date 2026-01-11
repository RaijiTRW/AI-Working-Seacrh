import AuthHero from "@/components/auth/AuthHero";
import AuthForm from "@/components/auth/AuthForm";

export const metadata = {
  title: "Вход | Поиск работы",
  description: "Войди или создай аккаунт для поиска работы",
};

export default function AuthPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Hero */}
      <AuthHero />

      {/* Right side - Form */}
      <div className="bg-white flex items-center justify-center">
        <AuthForm />
      </div>
    </div>
  );
}

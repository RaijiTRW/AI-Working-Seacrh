"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ResumeBuilder from "@/components/resume-builder/ResumeBuilder";
import AppHeader from "@/components/app/Header";

export default function ResumeBuilderPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      // Разрешаем доступ как авторизованным, так и гостям
      setUser(session?.user ? { id: session.user.id, email: session.user.email } : null);
      setLoading(false);
    };

    checkUser();
  }, [router]);

  // Показываем лоадер во время проверки
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0b0c10] relative">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 pointer-events-none" />
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#ff6b00] border-t-transparent shadow-[0_0_15px_rgba(255,107,0,0.5)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0c10] relative">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 pointer-events-none" />
      <AppHeader />
      <div className="pt-20 sm:pt-24 relative z-10">
        <ResumeBuilder user={user} />
      </div>
    </div>
  );
}

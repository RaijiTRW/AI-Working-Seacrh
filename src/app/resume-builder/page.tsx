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
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <>
      <AppHeader />
      <div className="pt-16">
        <ResumeBuilder user={user} />
      </div>
    </>
  );
}

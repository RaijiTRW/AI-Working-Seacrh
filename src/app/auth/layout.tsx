"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AppHeader from "@/components/app/Header";
import { User } from "@supabase/supabase-js";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Для авторизованных пользователей показываем полный Header
  // Исключаем главную страницу /auth где не нужен Header
  const showFullHeader = !loading && user && pathname !== "/auth";

  return (
    <>
      {showFullHeader && <AppHeader />}
      <div className={showFullHeader ? "pt-16" : ""}>
        {children}
      </div>
    </>
  );
}

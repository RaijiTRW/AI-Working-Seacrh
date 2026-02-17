"use client";

import { useEffect } from "react";
import { supabase } from "./supabase";

/**
 * Хук для отслеживания онлайн-статуса пользователя.
 * Обновляет last_seen_at каждые 2 минуты при активности.
 */
export function useOnlineStatus() {
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const updateLastSeen = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          await fetch("/api/user/ping", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });
        }
      } catch (e) {
        // Silently fail - offline status is not critical
      }
    };

    // Сразу обновляем при загрузке
    updateLastSeen();

    // Затем обновляем каждые 2 минуты
    intervalId = setInterval(updateLastSeen, 2 * 60 * 1000);

    // Также обновляем при активности пользователя
    const handleActivity = () => {
      // Debounce - не обновляем слишком часто
      updateLastSeen();
    };

    // Отслеживаем активность пользователя
    window.addEventListener("focus", handleActivity);
    window.addEventListener("click", handleActivity);
    window.addEventListener("keydown", handleActivity);

    return () => {
      if (intervalId) clearInterval(intervalId);
      window.removeEventListener("focus", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("keydown", handleActivity);
    };
  }, []);
}

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "./supabase";
import {
  getSubscription,
  createSubscriptionCheckout,
  buyExtraRequests,
  createTrial,
  cancelAutoRenewal,
  type SubscriptionInfo,
} from "./api";

interface UseSubscriptionReturn {
  subscription: SubscriptionInfo | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  checkout: () => Promise<string | null>;
  buyExtra: () => Promise<string | null>;
  initTrial: () => Promise<boolean>;
  cancelAutoRenewal: () => Promise<boolean>;
  manualRenewal: () => Promise<boolean>;
}

export function useSubscription(): UseSubscriptionReturn {
  const { user, loading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiAvailable = useRef(true);
  const retryCount = useRef(0);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setLoading(false);
        return;
      }

      const data = await getSubscription(session.access_token);
      setSubscription(data);
      setError(null);
      apiAvailable.current = true;
      retryCount.current = 0;
    } catch (err) {
      retryCount.current++;

      // Логируем только один раз
      if (retryCount.current === 1) {
        console.warn("[useSubscription] API недоступен, оставляем последнее корректное состояние");
      }

      // Не подменяем подписку на Base при сетевой/серверной ошибке,
      // чтобы не показывать пользователю неверный план.
      apiAvailable.current = false;
      setError(err instanceof Error ? err.message : "Ошибка обновления подписки");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Ручное продление подписки
  const manualRenewal = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("Нет активной сессии");
        return false;
      }

      const response = await fetch("/api/subscription/manual-renew", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        setError(data?.error || "Ошибка продления подписки");
        return false;
      }

      await fetchSubscription();
      return true;
    } catch (err) {
      console.error("[useSubscription] manual renewal error:", err);
      setError(err instanceof Error ? err.message : "Ошибка продления");
      return false;
    }
  }, [fetchSubscription]);

  // Загрузка при монтировании и смене пользователя
  useEffect(() => {
    if (!authLoading) {
      fetchSubscription();
    }
  }, [authLoading, fetchSubscription]);

  // Автообновление каждые 30 секунд (если API доступен) или 5 минут (если нет)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(
      fetchSubscription,
      apiAvailable.current ? 30000 : 300000 // 30 сек или 5 мин
    );
    return () => clearInterval(interval);
  }, [user, fetchSubscription]);

  // Оформить подписку Pro
  const checkout = useCallback(async (): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("Нет активной сессии");
        return null;
      }

      const result = await createSubscriptionCheckout(session.access_token);
      return result.payment_url;
    } catch (err) {
      console.error("[useSubscription] checkout error:", err);
      setError(err instanceof Error ? err.message : "Ошибка создания платежа");
      return null;
    }
  }, []);

  // Докупить запросы
  const buyExtra = useCallback(async (): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("Нет активной сессии");
        return null;
      }

      const result = await buyExtraRequests(session.access_token);
      return result.payment_url;
    } catch (err) {
      console.error("[useSubscription] buyExtra error:", err);
      setError(err instanceof Error ? err.message : "Ошибка создания платежа");
      return null;
    }
  }, []);

  // Создать триал (для новых пользователей)
  const initTrial = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("Нет активной сессии");
        return false;
      }

      await createTrial(session.access_token);
      await fetchSubscription();
      return true;
    } catch (err) {
      console.error("[useSubscription] initTrial error:", err);
      setError(err instanceof Error ? err.message : "Ошибка создания триала");
      return false;
    }
  }, [fetchSubscription]);

  // Отменить автопродление подписки
  const cancelAutoRenewalCallback = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("Нет активной сессии");
        return false;
      }

      await cancelAutoRenewal(session.access_token);
      await fetchSubscription();
      return true;
    } catch (err) {
      console.error("[useSubscription] cancelAutoRenewal error:", err);
      setError(err instanceof Error ? err.message : "Ошибка отмены автопродления");
      return false;
    }
  }, [fetchSubscription]);

  return {
    subscription,
    loading,
    error,
    refresh: fetchSubscription,
    checkout,
    buyExtra,
    initTrial,
    cancelAutoRenewal: cancelAutoRenewalCallback,
    manualRenewal,
  };
}

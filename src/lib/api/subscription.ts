/**
 * Subscription API - управление подписками
 */

const NEXT_API = "";

export interface Subscription {
  plan: "pro_trial" | "base" | "pro";
  status: "active" | "expired" | "cancelled";
  expires_at: string | null;  // null для base плана
  days_left: number | null;   // null для base плана
  can_search_online: boolean; // false для base плана
  purchase_price?: number;    // Цена, по которой пользователь купил подписку (для автопродления)
}

export interface RequestLimits {
  daily_limit: number;
  daily_used: number;
  bonus_requests: number;
  remaining: number;
  can_use: boolean;
}

export interface SubscriptionPrices {
  subscription: number;
  subscription_discounted?: number;
  extra_requests: number;
  extra_requests_count: number;
}

export interface DiscountInfo {
  enabled: boolean;
  percent: number;
  is_first_purchase: boolean;
}

export interface SubscriptionInfo {
  subscription: Subscription | null;
  limits: RequestLimits;
  // Флаги планов
  is_pro_trial: boolean;       // На Pro Trial (3 дня)
  is_base: boolean;            // На Base (бесплатный навсегда)
  is_pro: boolean;             // На Pro (платная подписка)
  is_pro_trial_expired: boolean; // Pro Trial истёк, показать модалку
  is_pro_expired: boolean;     // Платная Pro подписка истекла
  prices: SubscriptionPrices;
  discount?: DiscountInfo;     // Информация о скидке на первую покупку
  has_saved_payment_method?: boolean; // Есть ли сохранённый платёжный метод для автосписания
}

export interface CheckoutResponse {
  payment_id: string;
  payment_url: string;
}

export interface PaymentStatus {
  status: string;
  paid: boolean;
  type?: "subscription" | "extra_requests";
}

/**
 * Получить информацию о подписке текущего пользователя
 */
export async function getSubscription(token: string): Promise<SubscriptionInfo> {
  const response = await fetch(`${NEXT_API}/api/subscription`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized");
    }
    throw new Error("Failed to fetch subscription");
  }

  return response.json();
}

/**
 * Создать платёж для подписки Pro
 */
export async function createSubscriptionCheckout(
  token: string
): Promise<CheckoutResponse> {
  const response = await fetch(`${NEXT_API}/api/subscription/checkout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to create checkout");
  }

  return response.json();
}

/**
 * Создать платёж для докупки запросов
 */
export async function buyExtraRequests(
  token: string
): Promise<CheckoutResponse> {
  const response = await fetch(`${NEXT_API}/api/subscription/extra`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to create payment");
  }

  return response.json();
}

/**
 * Проверить статус платежа
 */
export async function checkPaymentStatus(
  token: string,
  paymentId: string
): Promise<PaymentStatus> {
  const response = await fetch(
    `${NEXT_API}/api/subscription/check/${paymentId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to check payment status");
  }

  return response.json();
}

/**
 * Отменить pending платёж
 */
export async function cancelPayment(
  token: string,
  paymentId: string
): Promise<{ status: string; message?: string }> {
  const response = await fetch(
    `${NEXT_API}/api/subscription/cancel/${paymentId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to cancel payment");
  }

  return response.json();
}

/**
 * Создать триал подписку (если не создалась автоматически)
 */
export async function createTrial(token: string): Promise<void> {
  const response = await fetch(`${NEXT_API}/api/subscription/create-trial`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to create trial");
  }
}

/**
 * Отменить автопродление подписки
 */
export async function cancelAutoRenewal(token: string): Promise<void> {
  const response = await fetch(`${NEXT_API}/api/subscription/cancel-auto-renewal`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to cancel auto renewal");
  }
}

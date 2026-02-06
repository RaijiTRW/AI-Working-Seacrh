"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useSubscription } from "@/lib/useSubscription";
import { TrialExpiredModal } from "./TrialExpiredModal";
import type { SubscriptionInfo } from "@/lib/api";

interface SubscriptionContextValue {
  subscription: SubscriptionInfo | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  checkout: () => Promise<string | null>;
  buyExtra: () => Promise<string | null>;
  cancelAutoRenewal: () => Promise<boolean>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function useSubscriptionContext() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscriptionContext must be used within SubscriptionProvider");
  }
  return context;
}

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const { subscription, loading, error, refresh, checkout, buyExtra, cancelAutoRenewal } = useSubscription();

  return (
    <SubscriptionContext.Provider
      value={{ subscription, loading, error, refresh, checkout, buyExtra, cancelAutoRenewal }}
    >
      {children}

      {/* Модальное окно истекшей подписки (Trial или платной) */}
      {subscription && (
        <TrialExpiredModal
          isProTrialExpired={subscription.is_pro_trial_expired}
          isProExpired={subscription.is_pro_expired}
          price={subscription.prices.subscription}
          discountedPrice={subscription.prices.subscription_discounted}
          discountPercent={subscription.discount?.percent}
          hasDiscount={subscription.discount?.enabled && subscription.discount?.percent > 0}
          onCheckout={checkout}
        />
      )}
    </SubscriptionContext.Provider>
  );
}

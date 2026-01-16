"use client";

import type { ReactNode } from "react";
import { SubscriptionProvider } from "@/components/subscription";
import FloatingChat from "@/components/chat/FloatingChat";

interface ClientProvidersProps {
  children: ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <SubscriptionProvider>
      {children}
      <FloatingChat />
    </SubscriptionProvider>
  );
}

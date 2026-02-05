"use client";

import type { ReactNode } from "react";
import { SubscriptionProvider } from "@/components/subscription";
import FloatingChat from "@/components/chat/FloatingChat";
import { useOnlineStatus } from "@/lib/useOnlineStatus";

function OnlineStatusTracker() {
  useOnlineStatus();
  return null;
}

interface ClientProvidersProps {
  children: ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <SubscriptionProvider>
      <OnlineStatusTracker />
      {children}
      <FloatingChat />
    </SubscriptionProvider>
  );
}

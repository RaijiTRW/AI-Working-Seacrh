import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Подписка",
  description:
    "Тарифы JobSearch. Pro подписка с расширенными возможностями AI-поиска работы.",
  keywords: [
    "подписка",
    "тарифы",
    "pro",
    "JobAISearch",
    "JobsSeacrh",
  ],
  openGraph: {
    title: "Подписка | JobSearch",
    description:
      "Тарифы JobSearch. Pro подписка с расширенными возможностями AI-поиска работы.",
  },
};

export default function SubscriptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

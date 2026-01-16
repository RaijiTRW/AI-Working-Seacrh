import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI-поиск работы",
  description:
    "Умный поиск вакансий с помощью искусственного интеллекта. Расскажите что ищете, и AI подберёт подходящие вакансии.",
  keywords: [
    "AI поиск работы",
    "умный поиск вакансий",
    "ИИ помощник",
    "чат бот вакансии",
  ],
  openGraph: {
    title: "AI-поиск работы | JobSearch",
    description:
      "Умный поиск вакансий с помощью искусственного интеллекта. Расскажите что ищете, и AI подберёт подходящие вакансии.",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

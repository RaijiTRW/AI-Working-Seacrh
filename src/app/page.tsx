import { Header } from "@/components/landing";
import LandingContent from "@/components/landing/LandingContent";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "JobAISearch — Умный поиск работы с ИИ",
  description:
    "Найдите работу быстрее с помощью искусственного интеллекта. Вакансии с hh.ru, Avito, SuperJob в одном месте. Персональный подбор без дубликатов.",
  keywords: [
    "поиск работы",
    "вакансии",
    "работа в России",
    "hh.ru",
    "avito работа",
    "superjob",
    "ИИ поиск вакансий",
    "найти работу",
    "трудоустройство",
    "карьера",
    "работа Москва",
    "удаленная работа",
  ],
  openGraph: {
    title: "JobAISearch — Умный поиск работы с ИИ",
    description:
      "Найдите работу быстрее с помощью искусственного интеллекта. Вакансии с hh.ru, Avito, SuperJob в одном месте. Персональный подбор без дубликатов.",
    type: "website",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://jobaisearch.ru",
    siteName: "JobAISearch",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "JobAISearch — Умный поиск работы с ИИ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "JobAISearch — Умный поиск работы с ИИ",
    description:
      "Найдите работу быстрее с помощью искусственного интеллекта. Вакансии с hh.ru, Avito, SuperJob в одном месте.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || "https://jobaisearch.ru",
  },
};

export default function Home() {
  return (
    <>
      <Header />
      <LandingContent />
    </>
  );
}

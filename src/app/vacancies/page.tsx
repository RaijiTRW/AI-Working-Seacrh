import { Metadata } from "next";
import VacanciesPageClient from "./VacanciesPageClient";

export const metadata: Metadata = {
  title: "Вакансии — Поиск работы в России | JobAISearch",
  description:
    "Тысячи актуальных вакансий от лучших работодателей России. Умный подбор с помощью ИИ. Вакансии с hh.ru, Avito, SuperJob в одном месте.",
  keywords: [
    "вакансии",
    "поиск работы",
    "работа в России",
    "работа Москва",
    "работа Санкт-Петербург",
    "удаленная работа",
    "работа без опыта",
    "вакансии для начинающих",
  ],
  openGraph: {
    title: "Вакансии — Поиск работы в России | JobAISearch",
    description:
      "Тысячи актуальных вакансий от лучших работодателей России. Умный подбор с помощью ИИ.",
    type: "website",
    url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://jobaisearch.ru"}/vacancies`,
    siteName: "JobAISearch",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Вакансии — JobAISearch",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Вакансии — Поиск работы в России",
    description: "Тысячи актуальных вакансий от лучших работодателей России.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || "https://jobaisearch.ru"}/vacancies`,
  },
};

export default function VacanciesPage() {
  return <VacanciesPageClient />;
}

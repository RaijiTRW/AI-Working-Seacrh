import { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobaisearch.ru";

export const metadata: Metadata = {
  title: "Вакансии — поиск работы в России",
  description:
    "Актуальные вакансии от работодателей России. Frontend, Backend, DevOps, дизайнер, менеджер и другие специальности. Фильтры по городу, зарплате и опыту. Вакансии с hh.ru, Avito и SuperJob.",
  keywords: [
    "вакансии",
    "работа",
    "поиск работы",
    "трудоустройство",
    "hh.ru",
    "avito",
    "superjob",
    "вакансии Москва",
    "вакансии Санкт-Петербург",
    "удалённая работа",
    "frontend разработчик",
    "backend разработчик",
    "программист вакансии",
    "работа IT",
    "работа без опыта",
    "вакансии сегодня",
  ],
  openGraph: {
    title: "Вакансии — поиск работы в России | JobAISearch",
    description:
      "Актуальные вакансии от работодателей России. Поиск работы с фильтрами по городу, зарплате и опыту. Более 1000 вакансий в одном месте.",
    url: `${siteUrl}/vacancies`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Вакансии — поиск работы в России | JobAISearch",
    description:
      "Актуальные вакансии от работодателей России. Frontend, Backend, DevOps, менеджер и другие специальности.",
  },
  alternates: {
    canonical: `${siteUrl}/vacancies`,
    types: {
      "application/rss+xml": `${siteUrl}/api/vacancies/rss`,
      "application/atom+xml": `${siteUrl}/api/vacancies/atom`,
    },
  },
};

export default function VacanciesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Вакансии — поиск работы в России",
    description:
      "Актуальные вакансии от работодателей России. Поиск работы с фильтрами по городу, зарплате и опыту.",
    url: `${siteUrl}/vacancies`,
    isPartOf: {
      "@type": "WebSite",
      name: "JobAISearch",
      url: siteUrl,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}

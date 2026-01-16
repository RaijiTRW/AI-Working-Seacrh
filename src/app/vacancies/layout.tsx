import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Вакансии",
  description:
    "Актуальные вакансии от работодателей России. Поиск работы с фильтрами по городу, зарплате и опыту. Вакансии с hh.ru, Avito и SuperJob.",
  keywords: [
    "вакансии",
    "работа",
    "поиск работы",
    "трудоустройство",
    "hh.ru",
    "avito",
    "superjob",
  ],
  openGraph: {
    title: "Вакансии | JobAISearch",
    description:
      "Актуальные вакансии от работодателей России. Поиск работы с фильтрами по городу, зарплате и опыту.",
  },
};

export default function VacanciesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

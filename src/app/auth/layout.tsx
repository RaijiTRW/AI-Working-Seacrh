import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Вход",
  description:
    "Войдите в JobAISearch для персонального поиска работы с помощью искусственного интеллекта.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

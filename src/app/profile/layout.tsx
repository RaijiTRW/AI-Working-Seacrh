import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Профиль",
  description:
    "Управление профилем, резюме и настройками аккаунта на JobSearch.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

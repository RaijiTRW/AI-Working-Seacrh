import { Suspense } from "react";
import MessagesClient from "./MessagesClient";

export const metadata = {
  title: "Сообщения | Поиск работы",
  description: "Общайтесь с работодателями",
};

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Загрузка...</div>}>
      <MessagesClient />
    </Suspense>
  );
}

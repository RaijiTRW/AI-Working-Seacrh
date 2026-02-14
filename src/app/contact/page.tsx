import { Metadata } from "next";
import { Header } from "@/components/landing";

export const metadata: Metadata = {
  title: "Контакты — JobAISearch",
  description: "Свяжитесь с нами. Помощь, поддержка, предложения.",
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">
          Контакты
        </h1>

        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Свяжитесь с нами</h2>
            <p className="text-gray-600 mb-6">
              Если у вас есть вопросы, предложения или нужна помощь — напишите нам.
            </p>
          </div>

          <div className="space-y-4">
            <a
              href="mailto:support@jobaisearch.ru"
              className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">Email</div>
                <div className="text-gray-500">support@jobaisearch.ru</div>
              </div>
            </a>

            <a
              href="https://t.me/jobaisearch"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">Telegram</div>
                <div className="text-gray-500">@jobaisearch</div>
              </div>
            </a>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <h3 className="font-semibold mb-2">Режим работы</h3>
            <p className="text-gray-600 text-sm">
              Пн-Пт: 10:00 — 19:00 (МСК)<br/>
              Ответим в течение 24 часов
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

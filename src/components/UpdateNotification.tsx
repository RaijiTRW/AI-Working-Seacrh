"use client";

import { useEffect, useState } from "react";

export default function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);

  useEffect(() => {
    // Получаем версию при загрузке страницы
    fetch("/api/version")
      .then((res) => res.json())
      .then((data) => {
        setCurrentVersion(data.version);
      })
      .catch(() => {
        console.warn("[UpdateNotification] Failed to fetch initial version");
      });

    // Проверяем обновления каждые 30 секунд
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/version");
        const data = await res.json();

        // Если версия изменилась и это не первая загрузка
        if (currentVersion && data.version !== currentVersion && data.version !== "dev") {
          setShowUpdate(true);
          clearInterval(interval); // Останавливаем проверку
        }
      } catch (err) {
        console.warn("[UpdateNotification] Failed to check version");
      }
    }, 30000); // 30 секунд

    return () => clearInterval(interval);
  }, [currentVersion]);

  if (!showUpdate) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-sm animate-slide-in-from-right">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-2xl p-4 border border-white/20">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-1">Доступно обновление</h4>
            <p className="text-xs text-white/90 mb-3">
              Вышла новая версия сайта. Перезагрузите страницу, чтобы получить последние улучшения.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-white text-blue-600 font-medium text-sm px-4 py-2 rounded-md hover:bg-blue-50 transition-colors"
            >
              Обновить сейчас
            </button>
          </div>
          <button
            onClick={() => setShowUpdate(false)}
            className="flex-shrink-0 text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

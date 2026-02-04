"use client";

import { useEffect, useState, ReactNode } from "react";

interface AutoUpdateProviderProps {
  children: ReactNode;
  checkInterval?: number; // Интервал проверки в миллисекундах (по умолчанию 2 минуты)
}

export default function AutoUpdateProvider({ 
  children, 
  checkInterval = 120000 
}: AutoUpdateProviderProps) {
  const [showUpdate, setShowUpdate] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string>("");
  const [newVersion, setNewVersion] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    // Функция проверки новой версии
    const checkForUpdates = async () => {
      try {
        const response = await fetch("/api/version");
        if (!response.ok) return;

        const data = await response.json();
        const serverVersion = data.version || data.commit || "";
        
        // Сохраняем текущую версию при первой проверке
        if (!currentVersion && serverVersion) {
          if (mounted) setCurrentVersion(serverVersion);
          return;
        }

        // Проверяем, изменилась ли версия
        if (serverVersion && serverVersion !== currentVersion) {
          if (mounted) {
            setNewVersion(serverVersion);
            setShowUpdate(true);
          }
        }
      } catch (error) {
        console.error("Failed to check for updates:", error);
      }
    };

    // Первая проверка сразу
    checkForUpdates();

    // Периодическая проверка
    const intervalId = setInterval(checkForUpdates, checkInterval);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [checkInterval, currentVersion]);

  const handleReload = () => {
    // Перезагружаем страницу с очисткой кэша
    window.location.reload();
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  return (
    <>
      {children}
      {showUpdate && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 animate-in slide-in-from-right-5">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  Доступно обновление
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Сайт был обновлён до новой версии. Нажмите кнопку, чтобы применить
                  изменения.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleReload}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Обновить
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
                  >
                    Позже
                  </button>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export { AutoUpdateProvider as UpdateProvider };

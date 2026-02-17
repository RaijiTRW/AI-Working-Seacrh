"use client";

import { useEffect, useState, createContext, useContext, ReactNode } from "react";

interface VersionInfo {
  version: string;
  gitCommit: string | null;
  timestamp: string;
}

interface UpdateContextType {
  hasUpdate: boolean;
  newVersion: string | null;
  reloadPage: () => void;
}

const UpdateContext = createContext<UpdateContextType>({
  hasUpdate: false,
  newVersion: null,
  reloadPage: () => {},
});

export function useUpdate() {
  return useContext(UpdateContext);
}

interface UpdateProviderProps {
  children: ReactNode;
  checkInterval?: number; // в миллисекундах, по умолчанию 2 минуты
}

export function UpdateProvider({ children, checkInterval = 120000 }: UpdateProviderProps) {
  const [initialVersion, setInitialVersion] = useState<VersionInfo | null>(null);
  const [currentVersion, setCurrentVersion] = useState<VersionInfo | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  // Получаем текущую версию
  const fetchVersion = async (): Promise<VersionInfo | null> => {
    try {
      const response = await fetch("/api/version", {
        cache: "no-store",
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
    }
    return null;
  };

  // Инициализация - сохраняем начальную версию
  useEffect(() => {
    const initVersion = async () => {
      const version = await fetchVersion();
      if (version) {
        setInitialVersion(version);
        setCurrentVersion(version);
      }
    };
    initVersion();
  }, []);

  // Периодическая проверка обновлений
  useEffect(() => {
    if (!initialVersion) return;

    const checkForUpdates = async () => {
      const version = await fetchVersion();
      if (version) {
        setCurrentVersion(version);

        // Сравниваем версии или git commit
        const isDifferent =
          version.version !== initialVersion.version ||
          version.gitCommit !== initialVersion.gitCommit;

        if (isDifferent) {
          setHasUpdate(true);
          setShowNotification(true);
        }
      }
    };

    const interval = setInterval(checkForUpdates, checkInterval);
    return () => clearInterval(interval);
  }, [initialVersion, checkInterval]);

  // Перезагрузка страницы
  const reloadPage = () => {
    setShowNotification(false);
    window.location.reload();
  };

  // Отложить уведомление
  const dismissNotification = () => {
    setShowNotification(false);
  };

  return (
    <UpdateContext.Provider value={{ hasUpdate, newVersion: currentVersion?.version || null, reloadPage }}>
      {children}
      {hasUpdate && showNotification && (
        <UpdateBanner
          currentVersion={initialVersion?.version || "unknown"}
          newVersion={currentVersion?.version || "unknown"}
          onReload={reloadPage}
          onDismiss={dismissNotification}
        />
      )}
    </UpdateContext.Provider>
  );
}

interface UpdateBannerProps {
  currentVersion: string;
  newVersion: string;
  onReload: () => void;
  onDismiss: () => void;
}

function UpdateBanner({ currentVersion, newVersion, onReload, onDismiss }: UpdateBannerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-xl p-4 border border-gray-700">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">Доступна новая версия</h3>
            <p className="text-xs text-gray-400 mb-3">
              Версия {newVersion} готова к установке (текущая: {currentVersion})
            </p>
            <div className="flex gap-2">
              <button
                onClick={onReload}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-md transition-colors"
              >
                Обновить
              </button>
              <button
                onClick={onDismiss}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium px-3 py-2 rounded-md transition-colors"
              >
                Позже
              </button>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

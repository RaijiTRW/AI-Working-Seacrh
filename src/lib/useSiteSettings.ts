import { useEffect, useState } from "react";
import { supabase } from "./supabase";

interface SiteSettings {
  registration_enabled: boolean;
  chat_enabled: boolean;
  vacancies_enabled: boolean;
  vacancy_creation_enabled: boolean;
}

const defaultSettings: SiteSettings = {
  registration_enabled: true,
  chat_enabled: true,
  vacancies_enabled: true,
  vacancy_creation_enabled: true,
};

/**
 * Хук для получения настроек сайта из БД
 * Кеширует настройки и обновляет при изменении
 */
export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("id, value");

        if (error) {
          setSettings(defaultSettings);
          return;
        }

        if (data) {
          const settingsMap: Record<string, boolean> = {};
          data.forEach((setting: any) => {
            settingsMap[setting.id] = setting.value?.enabled ?? true;
          });

          setSettings({
            registration_enabled: settingsMap.registration_enabled ?? true,
            chat_enabled: settingsMap.chat_enabled ?? true,
            vacancies_enabled: settingsMap.vacancies_enabled ?? true,
            vacancy_creation_enabled: settingsMap.vacancy_creation_enabled ?? true,
          });
        }
      } catch (err) {
        setSettings(defaultSettings);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();

    // Подписка на изменения настроек
    const subscription = supabase
      .channel("site_settings_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "site_settings",
        },
        () => {
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { settings, loading };
}

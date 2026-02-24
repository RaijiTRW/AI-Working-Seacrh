"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface ProfileSectionProps {
  userId: string;
  email?: string;
}

interface Profile {
  first_name: string;
  last_name: string;
  patronymic: string;
  phone: string;
  city: string;
  birth_date: string;
}

export default function ProfileSection({ userId, email }: ProfileSectionProps) {
  const [profile, setProfile] = useState<Profile>({
    first_name: "",
    last_name: "",
    patronymic: "",
    phone: "",
    city: "",
    birth_date: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        // PGRST116 = no rows returned, that's ok for new users
        if (error.code !== "PGRST116") {
          setMessage({ type: "error", text: `Ошибка загрузки: ${error.message}` });
        }
        return;
      }

      if (data) {
        setProfile({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          patronymic: data.patronymic || "",
          phone: data.phone || "",
          city: data.city || "",
          birth_date: data.birth_date || "",
        });
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // Проверяем актуальность сессии
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setMessage({ type: "error", text: "Сессия истекла. Пожалуйста, войдите заново." });
        setSaving(false);
        return;
      }

      // Проверяем что userId совпадает с текущим пользователем
      if (session.user.id !== userId) {
        setMessage({ type: "error", text: "Ошибка авторизации. Перезагрузите страницу." });
        setSaving(false);
        return;
      }

      // Преобразуем пустые строки в null для полей с типом date
      const profileData = {
        user_id: userId,
        first_name: profile.first_name || null,
        last_name: profile.last_name || null,
        patronymic: profile.patronymic || null,
        phone: profile.phone || null,
        city: profile.city || null,
        birth_date: profile.birth_date || null,
        updated_at: new Date().toISOString(),
      };

      // Используем upsert для атомарной операции
      const { error } = await supabase
        .from("profiles")
        .upsert(profileData, { onConflict: "user_id" });

      if (error) {
        throw new Error(error.message || error.code || "Ошибка сохранения");
      }

      // Синхронизируем данные с резюме
      try {
        // Получаем текущее резюме пользователя
        const { data: existingResume } = await supabase
          .from("resumes")
          .select("id, personal_info, contacts")
          .eq("user_id", userId)
          .maybeSingle();

        if (existingResume) {
          // Подготавливаем данные для обновления резюме
          const resumeUpdates: any = {
            updated_at: new Date().toISOString(),
          };

          // Обновляем personal_info
          const personalInfo = existingResume.personal_info || {};
          resumeUpdates.personal_info = {
            ...personalInfo,
            first_name: profile.first_name || personalInfo.first_name || "",
            last_name: profile.last_name || personalInfo.last_name || "",
            middle_name: profile.patronymic || personalInfo.middle_name || "",
            birth_date: profile.birth_date || personalInfo.birth_date || "",
          };

          // Обновляем contacts
          const contacts = existingResume.contacts || {};
          resumeUpdates.contacts = {
            ...contacts,
            phone: profile.phone || contacts.phone || "",
            city: profile.city || contacts.city || "",
          };

          // Обновляем резюме
          const { error: resumeError } = await supabase
            .from("resumes")
            .update(resumeUpdates)
            .eq("id", existingResume.id);

          if (resumeError) {
            // Не прерываем операцию
          }
        }
      } catch (syncError) {
        // Не прерываем операцию
      }

      setMessage({ type: "success", text: "Профиль сохранён" });
    } catch (err: unknown) {
      let errorMessage = "Неизвестная ошибка";

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "object" && err !== null) {
        const e = err as { message?: string; code?: string };
        errorMessage = e.message || e.code || JSON.stringify(err);
      }

      setMessage({ type: "error", text: `Ошибка: ${errorMessage}` });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#1f2833]/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/10 rounded w-1/4" />
          <div className="h-10 bg-white/10 rounded" />
          <div className="h-10 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1f2833]/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl">
      <h2 className="text-xl font-semibold text-white mb-6">Личные данные</h2>

      <div className="space-y-5">
        {/* Name fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Фамилия</label>
            <input
              type="text"
              value={profile.last_name}
              onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
              className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#ff6b00] focus:border-[#ff6b00] transition-colors"
              placeholder="Иванов"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Имя</label>
            <input
              type="text"
              value={profile.first_name}
              onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
              className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#ff6b00] focus:border-[#ff6b00] transition-colors"
              placeholder="Иван"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Отчество</label>
            <input
              type="text"
              value={profile.patronymic}
              onChange={(e) => setProfile({ ...profile, patronymic: e.target.value })}
              className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#ff6b00] focus:border-[#ff6b00] transition-colors"
              placeholder="Иванович"
            />
          </div>
        </div>

        {/* Email (readonly) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
          <input
            type="email"
            value={email || ""}
            disabled
            className="w-full px-4 py-2.5 bg-white/5 border border-white/5 rounded-xl text-gray-400 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1.5">Изменить email можно в разделе Безопасность</p>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Телефон</label>
          <input
            type="tel"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#ff6b00] focus:border-[#ff6b00] transition-colors"
            placeholder="+7 (999) 123-45-67"
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Город</label>
          <input
            type="text"
            value={profile.city}
            onChange={(e) => setProfile({ ...profile, city: e.target.value })}
            className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#ff6b00] focus:border-[#ff6b00] transition-colors"
            placeholder="Москва"
          />
        </div>

        {/* Birth date */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Дата рождения</label>
          <input
            type="date"
            value={profile.birth_date}
            onChange={(e) => setProfile({ ...profile, birth_date: e.target.value })}
            className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#ff6b00] focus:border-[#ff6b00] transition-colors [color-scheme:dark]"
          />
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-xl text-sm border ${message.type === "success"
              ? "bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20"
              : "bg-red-500/10 text-red-400 border-red-500/20"
            }`}>
            {message.text}
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] text-white font-medium rounded-xl hover:shadow-[0_0_15px_rgba(255,107,0,0.4)] transition-all duration-300 disabled:opacity-50 mt-4"
        >
          {saving ? "Сохранение..." : "Сохранить изменения"}
        </button>
      </div>
    </div>
  );
}

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
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

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
      // Profile doesn't exist yet, that's ok
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: userId,
          ...profile,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      setMessage({ type: "success", text: "Профиль сохранён" });
    } catch (err) {
      setMessage({ type: "error", text: "Ошибка сохранения" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Личные данные</h2>

      <div className="space-y-4">
        {/* Name fields */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия</label>
            <input
              type="text"
              value={profile.last_name}
              onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Иванов"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
            <input
              type="text"
              value={profile.first_name}
              onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Иван"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Отчество</label>
            <input
              type="text"
              value={profile.patronymic}
              onChange={(e) => setProfile({ ...profile, patronymic: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Иванович"
            />
          </div>
        </div>

        {/* Email (readonly) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email || ""}
            disabled
            className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
          />
          <p className="text-xs text-gray-400 mt-1">Изменить email можно в разделе Безопасность</p>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
          <input
            type="tel"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="+7 (999) 123-45-67"
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Город</label>
          <input
            type="text"
            value={profile.city}
            onChange={(e) => setProfile({ ...profile, city: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Москва"
          />
        </div>

        {/* Birth date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Дата рождения</label>
          <input
            type="date"
            value={profile.birth_date}
            onChange={(e) => setProfile({ ...profile, birth_date: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        {/* Message */}
        {message && (
          <div className={`p-3 rounded-xl text-sm ${
            message.type === "success" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
          }`}>
            {message.text}
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {saving ? "Сохранение..." : "Сохранить"}
        </button>
      </div>
    </div>
  );
}

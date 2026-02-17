"use client";

import { useState, useRef } from "react";
import { Upload, X, User } from "lucide-react";
import { PersonalInfo } from "@/types/resume";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PersonalInfoSectionProps {
  data: PersonalInfo;
  onChange: (field: keyof PersonalInfo, value: PersonalInfo[keyof PersonalInfo]) => void;
  userId?: string;
}

export default function PersonalInfoSection({ data, onChange, userId }: PersonalInfoSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(data.photo_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAuthenticated = !!userId;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка авторизации для загрузки фото
    if (!isAuthenticated) {
      alert("Для загрузки фото необходимо войти в аккаунт");
      return;
    }

    // Получаем токен из сессии для авторизации на сервере
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      alert("Сессия истекла. Пожалуйста, войдите снова.");
      return;
    }

    // Проверка типа файла
    if (!file.type.startsWith("image/")) {
      alert("Пожалуйста, выберите изображение");
      return;
    }

    // Проверка размера (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Размер файла не должен превышать 5MB");
      return;
    }

    // Создаем превью
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Загружаем на сервер
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/resume/upload-photo", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(errorData.detail || "Не удалось загрузить фото");
      }

      const result = await response.json();
      onChange("photo_url", result.url);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Не удалось загрузить фото. Попробуйте еще раз.");
      setPreviewUrl(data.photo_url || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPreviewUrl(null);
    onChange("photo_url", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {/* Имя */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Имя <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={data.first_name}
          onChange={(e) => onChange("first_name", e.target.value)}
          placeholder="Иван"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          required
        />
      </div>

      {/* Фамилия */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Фамилия <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={data.last_name}
          onChange={(e) => onChange("last_name", e.target.value)}
          placeholder="Иванов"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          required
        />
      </div>

      {/* Отчество */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Отчество
        </label>
        <input
          type="text"
          value={data.middle_name || ""}
          onChange={(e) => onChange("middle_name", e.target.value)}
          placeholder="Иванович"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Необязательно, но рекомендуется для российского рынка
        </p>
      </div>

      {/* Дата рождения */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Дата рождения
        </label>
        <input
          type="date"
          value={data.birth_date || ""}
          onChange={(e) => onChange("birth_date", e.target.value)}
          max={new Date().toISOString().split("T")[0]}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Необязательно. Работодатели не могут спрашивать возраст по закону.
        </p>
      </div>

      {/* Пол */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Пол
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="gender"
              checked={data.gender === "male"}
              onChange={() => onChange("gender", "male")}
              className="w-4 h-4 text-orange-500 focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700">Мужской</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="gender"
              checked={data.gender === "female"}
              onChange={() => onChange("gender", "female")}
              className="w-4 h-4 text-orange-500 focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700">Женский</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="gender"
              checked={data.gender === null || data.gender === undefined}
              onChange={() => onChange("gender", null)}
              className="w-4 h-4 text-orange-500 focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700">Не указывать</span>
          </label>
        </div>
      </div>

      {/* Фото */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Фото
        </label>

        {/* Превью фото */}
        {previewUrl ? (
          <div className="relative inline-block mb-3">
            <img
              src={previewUrl}
              alt="Превью фото"
              className="w-32 h-32 object-cover rounded-lg border border-gray-200"
            />
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              aria-label="Удалить фото"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-colors mb-3"
          >
            <User className="w-12 h-12 text-gray-400" />
          </div>
        )}

        {/* Скрытый input для файла */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        {/* Кнопка загрузки */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="w-4 h-4" />
          {uploading ? "Загрузка..." : previewUrl ? "Изменить фото" : "Загрузить фото"}
        </button>

        <p className="text-xs text-gray-500 mt-1">
          JPG, PNG или WebP, максимум 5MB. Рекомендуемый размер: 200x200px.
        </p>
      </div>
    </div>
  );
}

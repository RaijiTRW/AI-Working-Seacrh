"use client";

import { PersonalInfo } from "@/types/resume";

interface PersonalInfoSectionProps {
  data: PersonalInfo;
  onChange: (field: keyof PersonalInfo, value: PersonalInfo[keyof PersonalInfo]) => void;
}

export default function PersonalInfoSection({ data, onChange }: PersonalInfoSectionProps) {
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
          URL фото
        </label>
        <input
          type="url"
          value={data.photo_url || ""}
          onChange={(e) => onChange("photo_url", e.target.value)}
          placeholder="https://example.com/photo.jpg"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Вставьте прямую ссылку на фото. Рекомендуемый размер: 200x200px.
        </p>
      </div>
    </div>
  );
}

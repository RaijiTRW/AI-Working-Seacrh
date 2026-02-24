"use client";

import { Contacts, EmploymentType, EMPLOYMENT_TYPE_OPTIONS } from "@/types/resume";

interface ContactsSectionProps {
  data: Contacts;
  onChange: (field: keyof Contacts, value: string | boolean | string[]) => void;
}

export default function ContactsSection({ data, onChange }: ContactsSectionProps) {
  const toggleEmploymentType = (type: EmploymentType) => {
    const current = data.employment_type || [];
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    onChange("employment_type", updated);
  };

  return (
    <div className="space-y-4">
      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Email <span className="text-[#ff6b00]">*</span>
        </label>
        <input
          type="email"
          value={data.email}
          onChange={(e) => onChange("email", e.target.value)}
          placeholder="example@mail.com"
          className="w-full px-4 py-2 bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50 focus:border-[#ff6b00] transition-colors"
          required
        />
        <p className="text-xs text-gray-400 mt-1">
          Используйте профессиональный email (имя.фамилия@mail.com)
        </p>
      </div>

      {/* Телефон */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Телефон <span className="text-[#ff6b00]">*</span>
        </label>
        <input
          type="tel"
          value={data.phone}
          onChange={(e) => onChange("phone", e.target.value)}
          placeholder="+7 (999) 123-45-67"
          className="w-full px-4 py-2 bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50 focus:border-[#ff6b00] transition-colors"
          required
        />
        <p className="text-xs text-gray-400 mt-1">
          Укажите код страны: +7 для России
        </p>
      </div>

      {/* Город */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Город <span className="text-[#ff6b00]">*</span>
        </label>
        <input
          type="text"
          value={data.city}
          onChange={(e) => onChange("city", e.target.value)}
          placeholder="Москва"
          className="w-full px-4 py-2 bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50 focus:border-[#ff6b00] transition-colors"
          required
        />
      </div>

      {/* Telegram */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Telegram
        </label>
        <div className="flex">
          <span className="inline-flex items-center px-3 bg-white/5 border border-r-0 border-white/10 rounded-l-lg text-gray-400 text-sm">
            @
          </span>
          <input
            type="text"
            value={data.telegram || ""}
            onChange={(e) => onChange("telegram", e.target.value)}
            placeholder="username"
            className="flex-1 px-4 py-2 bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50 focus:border-[#ff6b00] transition-colors"
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Без символа @
        </p>
      </div>

      {/* LinkedIn */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          LinkedIn
        </label>
        <input
          type="url"
          value={data.linkedin || ""}
          onChange={(e) => onChange("linkedin", e.target.value)}
          placeholder="https://linkedin.com/in/username"
          className="w-full px-4 py-2 bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50 focus:border-[#ff6b00] transition-colors"
        />
      </div>

      {/* GitHub */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          GitHub
        </label>
        <input
          type="url"
          value={data.github || ""}
          onChange={(e) => onChange("github", e.target.value)}
          placeholder="https://github.com/username"
          className="w-full px-4 py-2 bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50 focus:border-[#ff6b00] transition-colors"
        />
        <p className="text-xs text-gray-400 mt-1">
          Актуально для IT-специалистов
        </p>
      </div>

      {/* Портфолио */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Портфолио / Сайт
        </label>
        <input
          type="url"
          value={data.portfolio || ""}
          onChange={(e) => onChange("portfolio", e.target.value)}
          placeholder="https://yourportfolio.com"
          className="w-full px-4 py-2 bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50 focus:border-[#ff6b00] transition-colors"
        />
      </div>

      {/* Готовность к переезду */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={data.ready_to_relocate}
            onChange={(e) => onChange("ready_to_relocate", e.target.checked)}
            className="w-4 h-4 text-[#ff6b00] focus:ring-[#ff6b00] rounded bg-black/40 border-white/20"
          />
          <span className="text-sm font-medium text-gray-300">
            Готов к переезду
          </span>
        </label>
        <p className="text-xs text-gray-400 mt-1">
          Работодатели увидят это в резюме
        </p>
      </div>

      {/* Тип занятости */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Желаемый тип занятости
        </label>
        <div className="space-y-2">
          {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.employment_type?.includes(option.value) || false}
                onChange={() => toggleEmploymentType(option.value)}
                className="w-4 h-4 text-[#ff6b00] focus:ring-[#ff6b00] rounded bg-black/40 border-white/20"
              />
              <span className="text-sm text-gray-300">{option.label}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Можно выбрать несколько вариантов
        </p>
      </div>
    </div>
  );
}

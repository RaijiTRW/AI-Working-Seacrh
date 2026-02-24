"use client";

import { Language, LANGUAGE_LEVEL_OPTIONS } from "@/types/resume";
import { Plus, Trash2 } from "lucide-react";

interface LanguagesSectionProps {
  data: Language[];
  onChange: (data: Language[]) => void;
}

export default function LanguagesSection({ data, onChange }: LanguagesSectionProps) {
  const addLanguage = () => {
    const newLang: Language = {
      id: `lang_${Date.now()}`,
      language: "",
      level: "A1",
    };
    onChange([...data, newLang]);
  };

  const removeLanguage = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  const updateLanguage = (index: number, field: keyof Language, value: string) => {
    onChange(
      data.map((lang, i) =>
        i === index ? { ...lang, [field]: value } : lang
      )
    );
  };

  const popularLanguages = [
    "Английский",
    "Немецкий",
    "Французский",
    "Испанский",
    "Китайский",
    "Японский",
    "Корейский",
    "Итальянский",
    "Португальский",
    "Арабский",
    "Турецкий",
    "Польский",
    "Украинский",
    "Белорусский",
    "Казахский",
  ];

  return (
    <div className="space-y-4">
      {/* Список языков */}
      <div className="space-y-3">
        {data.map((lang, index) => (
          <div key={lang.id ?? `language-${index}`} className="flex gap-3 items-center bg-[#1f2833]/50 backdrop-blur-md p-3 rounded-lg border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.2)]">
            <div className="flex-1 grid grid-cols-2 gap-3">
              {/* Название языка */}
              <div>
                <input
                  type="text"
                  value={lang.language}
                  onChange={(e) => updateLanguage(index, "language", e.target.value)}
                  placeholder="Английский"
                  list="popular-languages"
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50 focus:border-[#ff6b00] transition-colors"
                  required
                />
                <datalist id="popular-languages">
                  {popularLanguages.map((lang) => (
                    <option key={lang} value={lang} />
                  ))}
                </datalist>
              </div>

              {/* Уровень */}
              <div>
                <select
                  value={lang.level}
                  onChange={(e) => updateLanguage(index, "level", e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50 focus:border-[#ff6b00] transition-colors [&>option]:bg-[#1f2833]"
                >
                  {LANGUAGE_LEVEL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Кнопка удаления */}
            {data.length > 0 && (
              <button
                type="button"
                onClick={() => removeLanguage(index)}
                className="text-red-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                title="Удалить"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Кнопка добавления */}
      <button
        type="button"
        onClick={addLanguage}
        className="w-full py-3 border-2 border-dashed border-white/20 text-gray-400 bg-black/20 rounded-lg hover:border-[#ff6b00]/50 hover:text-[#ff6b00] hover:bg-white/5 font-medium flex items-center justify-center gap-2 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Добавить язык
      </button>

      {/* Пустое состояние */}
      {data.length === 0 && (
        <div className="text-center py-8 bg-[#1f2833]/50 backdrop-blur-md rounded-lg border border-dashed border-white/20">
          <p className="text-gray-400 mb-3 font-light">У вас пока нет добавленных языков</p>
          <button
            type="button"
            onClick={addLanguage}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] text-white rounded-lg hover:shadow-[0_0_15px_rgba(255,107,0,0.5)] transition-all font-medium"
          >
            <Plus className="w-4 h-4" />
            Добавить язык
          </button>
        </div>
      )}

      {/* Подсказки по уровням */}
      <div className="bg-[#00f0ff]/10 rounded-lg p-4 border border-[#00f0ff]/20">
        <h4 className="text-sm font-medium text-[#00f0ff] mb-4">
          💡 Уровни владения языками (CEFR):
        </h4>
        <div className="grid grid-cols-2 gap-4 text-xs text-[#00f0ff]/80">
          <div>
            <p className="font-semibold text-[#00f0ff]">A1 — Элементарный</p>
            <p className="text-[#00f0ff]/70 mt-1">Базовые фразы</p>
          </div>
          <div>
            <p className="font-semibold text-[#00f0ff]">A2 — Базовый</p>
            <p className="text-[#00f0ff]/70 mt-1">Простые ситуации</p>
          </div>
          <div>
            <p className="font-semibold text-[#00f0ff]">B1 — Средний</p>
            <p className="text-[#00f0ff]/70 mt-1">Повседневное общение</p>
          </div>
          <div>
            <p className="font-semibold text-[#00f0ff]">B2 — Средне-продвинутый</p>
            <p className="text-[#00f0ff]/70 mt-1">Профессиональный уровень</p>
          </div>
          <div>
            <p className="font-semibold text-[#00f0ff]">C1 — Продвинутый</p>
            <p className="text-[#00f0ff]/70 mt-1">Свободное владение</p>
          </div>
          <div>
            <p className="font-semibold text-[#00f0ff]">C2 — В совершенстве</p>
            <p className="text-[#00f0ff]/70 mt-1">Как родной</p>
          </div>
        </div>
      </div>
    </div>
  );
}

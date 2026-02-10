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
          <div key={lang.id ?? `language-${index}`} className="flex gap-3 items-start">
            <div className="flex-1 grid grid-cols-2 gap-3">
              {/* Название языка */}
              <div>
                <input
                  type="text"
                  value={lang.language}
                  onChange={(e) => updateLanguage(index, "language", e.target.value)}
                  placeholder="Английский"
                  list="popular-languages"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
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
                className="mt-2 text-red-500 hover:text-red-600 p-1"
                title="Удалить"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Кнопка добавления */}
      <button
        type="button"
        onClick={addLanguage}
        className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-orange-500 hover:text-orange-600 font-medium flex items-center justify-center gap-2 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Добавить язык
      </button>

      {/* Пустое состояние */}
      {data.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500 mb-3">У вас пока нет добавленных языков</p>
          <button
            type="button"
            onClick={addLanguage}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
          >
            <Plus className="w-4 h-4" />
            Добавить язык
          </button>
        </div>
      )}

      {/* Подсказки по уровням */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          💡 Уровни владения языками (CEFR):
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
          <div>
            <p className="font-medium">A1 — Элементарный</p>
            <p className="text-blue-700">Базовые фразы</p>
          </div>
          <div>
            <p className="font-medium">A2 — Базовый</p>
            <p className="text-blue-700">Простые ситуации</p>
          </div>
          <div>
            <p className="font-medium">B1 — Средний</p>
            <p className="text-blue-700">Повседневное общение</p>
          </div>
          <div>
            <p className="font-medium">B2 — Средне-продвинутый</p>
            <p className="text-blue-700">Профессиональный уровень</p>
          </div>
          <div>
            <p className="font-medium">C1 — Продвинутый</p>
            <p className="text-blue-700">Свободное владение</p>
          </div>
          <div>
            <p className="font-medium">C2 — В совершенстве</p>
            <p className="text-blue-700">Как родной</p>
          </div>
        </div>
      </div>
    </div>
  );
}

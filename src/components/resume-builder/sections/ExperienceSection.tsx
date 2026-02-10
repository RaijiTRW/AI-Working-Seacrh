"use client";

import { WorkExperience } from "@/types/resume";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { AIImprovementIcon } from "../AIImprovementButton";

interface ExperienceSectionProps {
  data: WorkExperience[];
  onChange: (data: WorkExperience[]) => void;
  userId?: string;
  isPro?: boolean;
  isProTrial?: boolean;
}

export default function ExperienceSection({
  data,
  onChange,
  userId,
  isPro,
  isProTrial
}: ExperienceSectionProps) {
  const addExperience = () => {
    const newExp: WorkExperience = {
      id: `exp_${Date.now()}`,
      company: "",
      position: "",
      start_date: "",
      end_date: "",
      is_current: false,
      description: "",
    };
    onChange([...data, newExp]);
  };

  const removeExperience = (id: string) => {
    onChange(data.filter((exp) => exp.id !== id));
  };

  const updateExperience = (id: string, field: keyof WorkExperience, value: string | boolean) => {
    onChange(
      data.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    );
  };

  return (
    <div className="space-y-6">
      {data.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500 mb-3">У вас пока нет опыта работы</p>
          <button
            type="button"
            onClick={addExperience}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
          >
            <Plus className="w-4 h-4" />
            Добавить опыт работы
          </button>
        </div>
      ) : (
        <>
          {data.map((exp, index) => (
            <div key={exp.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 relative">
              {/* Drag handle + Remove button */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <GripVertical className="w-5 h-5" />
                  <span className="text-sm font-medium text-gray-600">
                    Опыт работы #{index + 1}
                  </span>
                </div>
                {data.length > 0 && (
                  <button
                    type="button"
                    onClick={() => removeExperience(exp.id)}
                    className="text-red-500 hover:text-red-600 p-1"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {/* Компания */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Компания <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                    placeholder="ООО Рога и копыта"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    required
                  />
                </div>

                {/* Должность */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Должность <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={exp.position}
                    onChange={(e) => updateExperience(exp.id, "position", e.target.value)}
                    placeholder="Frontend-разработчик"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    required
                  />
                </div>

                {/* Период работы */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Начало <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="month"
                      value={exp.start_date}
                      onChange={(e) => updateExperience(exp.id, "start_date", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Окончание
                    </label>
                    <input
                      type="month"
                      value={exp.end_date || ""}
                      onChange={(e) => updateExperience(exp.id, "end_date", e.target.value)}
                      disabled={exp.is_current}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* По настоящее время */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exp.is_current}
                    onChange={(e) => {
                      updateExperience(exp.id, "is_current", e.target.checked);
                      if (e.target.checked) {
                        updateExperience(exp.id, "end_date", "");
                      }
                    }}
                    className="w-4 h-4 text-orange-500 focus:ring-orange-500 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Работаю по настоящее время
                  </span>
                </label>

                {/* Описание */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Описание деятельности
                    </label>
                    {userId && exp.description && (
                      <AIImprovementIcon
                        text={exp.description}
                        field="experience_description"
                        userId={userId}
                        isPro={isPro}
                        isProTrial={isProTrial}
                        onTextApply={(improvedText) =>
                          updateExperience(exp.id, "description", improvedText)
                        }
                      />
                    )}
                  </div>
                  <textarea
                    value={exp.description}
                    onChange={(e) => updateExperience(exp.id, "description", e.target.value)}
                    placeholder="Разрабатывал и поддерживал веб-приложения на React..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Опишите ваши обязанности и достижения. Используйте глаголы действия: разрабатывал, внедрил, увеличил.
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Add button */}
          <button
            type="button"
            onClick={addExperience}
            className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-orange-500 hover:text-orange-600 font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Добавить место работы
          </button>
        </>
      )}
    </div>
  );
}

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
        <div className="text-center py-8 bg-[#1f2833]/50 backdrop-blur-md rounded-lg border border-dashed border-white/20">
          <p className="text-gray-400 mb-3 font-light">У вас пока нет опыта работы</p>
          <button
            type="button"
            onClick={addExperience}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] text-white rounded-lg hover:shadow-[0_0_15px_rgba(255,107,0,0.5)] transition-all font-medium"
          >
            <Plus className="w-4 h-4" />
            Добавить опыт работы
          </button>
        </div>
      ) : (
        <>
          {data.map((exp, index) => (
            <div key={exp.id} className="bg-[#1f2833]/50 backdrop-blur-md rounded-lg p-4 border border-white/10 relative shadow-[0_0_20px_rgba(0,0,0,0.3)]">
              {/* Drag handle + Remove button */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <GripVertical className="w-5 h-5" />
                  <span className="text-sm font-medium text-white">
                    Опыт работы #{index + 1}
                  </span>
                </div>
                {data.length > 0 && (
                  <button
                    type="button"
                    onClick={() => removeExperience(exp.id)}
                    className="text-red-500 hover:text-red-400 p-1 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {/* Компания */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Компания <span className="text-[#ff6b00]">*</span>
                  </label>
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                    placeholder="ООО Рога и копыта"
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50 focus:border-[#ff6b00] transition-colors"
                    required
                  />
                </div>

                {/* Должность */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Должность <span className="text-[#ff6b00]">*</span>
                  </label>
                  <input
                    type="text"
                    value={exp.position}
                    onChange={(e) => updateExperience(exp.id, "position", e.target.value)}
                    placeholder="Frontend-разработчик"
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50 focus:border-[#ff6b00] transition-colors"
                    required
                  />
                </div>

                {/* Период работы */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Начало <span className="text-[#ff6b00]">*</span>
                    </label>
                    <input
                      type="month"
                      value={exp.start_date}
                      onChange={(e) => updateExperience(exp.id, "start_date", e.target.value)}
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50 focus:border-[#ff6b00] transition-colors [&::-webkit-calendar-picker-indicator]:filter-invert"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Окончание
                    </label>
                    <input
                      type="month"
                      value={exp.end_date || ""}
                      onChange={(e) => updateExperience(exp.id, "end_date", e.target.value)}
                      disabled={exp.is_current}
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50 focus:border-[#ff6b00] transition-colors disabled:bg-white/5 disabled:text-gray-500 disabled:cursor-not-allowed [&::-webkit-calendar-picker-indicator]:filter-invert"
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
                    className="w-4 h-4 text-[#ff6b00] focus:ring-[#ff6b00] rounded bg-black/40 border-white/20"
                  />
                  <span className="text-sm font-medium text-gray-300">
                    Работаю по настоящее время
                  </span>
                </label>

                {/* Описание */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-300">
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
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50 focus:border-[#ff6b00] transition-colors resize-none custom-scrollbar"
                  />
                  <p className="text-xs text-gray-500 mt-1 font-light">
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
            className="w-full py-3 border-2 border-dashed border-white/20 text-gray-400 bg-black/20 rounded-lg hover:border-[#ff6b00]/50 hover:text-[#ff6b00] hover:bg-white/5 font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Добавить место работы
          </button>
        </>
      )}
    </div>
  );
}

"use client";

import { Education, EDUCATION_DEGREE_OPTIONS } from "@/types/resume";
import { Plus, Trash2, GripVertical } from "lucide-react";

interface EducationSectionProps {
  data: Education[];
  onChange: (data: Education[]) => void;
}

export default function EducationSection({ data, onChange }: EducationSectionProps) {
  const addEducation = () => {
    const newEdu: Education = {
      id: `edu_${Date.now()}`,
      institution: "",
      degree: "bachelor",
      field: "",
      start_year: "",
      end_year: "",
    };
    onChange([...data, newEdu]);
  };

  const removeEducation = (id: string) => {
    onChange(data.filter((edu) => edu.id !== id));
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    onChange(
      data.map((edu) =>
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    );
  };

  const getCurrentYear = () => new Date().getFullYear();

  const generateYearOptions = () => {
    const currentYear = getCurrentYear();
    const years = [];
    for (let year = currentYear; year >= currentYear - 60; year--) {
      years.push(year);
    }
    return years;
  };

  return (
    <div className="space-y-6">
      {data.length === 0 ? (
        <div className="text-center py-8 bg-[#1f2833]/50 backdrop-blur-md rounded-lg border border-dashed border-white/20">
          <p className="text-gray-400 mb-3 font-light">У вас пока нет образования</p>
          <button
            type="button"
            onClick={addEducation}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] text-white rounded-lg hover:shadow-[0_0_15px_rgba(255,107,0,0.5)] transition-all font-medium"
          >
            <Plus className="w-4 h-4" />
            Добавить образование
          </button>
        </div>
      ) : (
        <>
          {data.map((edu, index) => (
            <div key={edu.id} className="bg-[#1f2833]/50 backdrop-blur-md rounded-lg p-4 border border-white/10 relative shadow-[0_0_20px_rgba(0,0,0,0.3)]">
              {/* Drag handle + Remove button */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <GripVertical className="w-5 h-5" />
                  <span className="text-sm font-medium text-white">
                    Образование #{index + 1}
                  </span>
                </div>
                {data.length > 0 && (
                  <button
                    type="button"
                    onClick={() => removeEducation(edu.id)}
                    className="text-red-500 hover:text-red-400 p-1 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {/* Учебное заведение */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Учебное заведение <span className="text-[#ff6b00]">*</span>
                  </label>
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) => updateEducation(edu.id, "institution", e.target.value)}
                    placeholder="Московский государственный университет"
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50 focus:border-[#ff6b00] transition-colors"
                    required
                  />
                </div>

                {/* Уровень образования */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Уровень образования <span className="text-[#ff6b00]">*</span>
                  </label>
                  <select
                    value={edu.degree}
                    onChange={(e) => updateEducation(edu.id, "degree", e.target.value)}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50 focus:border-[#ff6b00] transition-colors [&>option]:bg-[#1f2833]"
                    required
                  >
                    {EDUCATION_DEGREE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Специальность */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Специальность <span className="text-[#ff6b00]">*</span>
                  </label>
                  <input
                    type="text"
                    value={edu.field}
                    onChange={(e) => updateEducation(edu.id, "field", e.target.value)}
                    placeholder="Компьютерные науки и информатика"
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50 focus:border-[#ff6b00] transition-colors"
                    required
                  />
                </div>

                {/* Годы обучения */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Год начала <span className="text-[#ff6b00]">*</span>
                    </label>
                    <select
                      value={edu.start_year}
                      onChange={(e) => updateEducation(edu.id, "start_year", e.target.value)}
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50 focus:border-[#ff6b00] transition-colors [&>option]:bg-[#1f2833]"
                      required
                    >
                      <option value="">Выберите год</option>
                      {generateYearOptions().map((year) => (
                        <option key={year} value={year.toString()}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Год окончания
                    </label>
                    <select
                      value={edu.end_year || ""}
                      onChange={(e) => updateEducation(edu.id, "end_year", e.target.value)}
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50 focus:border-[#ff6b00] transition-colors [&>option]:bg-[#1f2833]"
                    >
                      <option value="">По настоящее время</option>
                      {generateYearOptions().map((year) => (
                        <option key={year} value={year.toString()}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Add button */}
          <button
            type="button"
            onClick={addEducation}
            className="w-full py-3 border-2 border-dashed border-white/20 text-gray-400 bg-black/20 rounded-lg hover:border-[#ff6b00]/50 hover:text-[#ff6b00] hover:bg-white/5 font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Добавить образование
          </button>
        </>
      )}
    </div>
  );
}

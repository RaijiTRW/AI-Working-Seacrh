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
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500 mb-3">У вас пока нет образования</p>
          <button
            type="button"
            onClick={addEducation}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
          >
            <Plus className="w-4 h-4" />
            Добавить образование
          </button>
        </div>
      ) : (
        <>
          {data.map((edu, index) => (
            <div key={edu.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 relative">
              {/* Drag handle + Remove button */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <GripVertical className="w-5 h-5" />
                  <span className="text-sm font-medium text-gray-600">
                    Образование #{index + 1}
                  </span>
                </div>
                {data.length > 0 && (
                  <button
                    type="button"
                    onClick={() => removeEducation(edu.id)}
                    className="text-red-500 hover:text-red-600 p-1"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {/* Учебное заведение */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Учебное заведение <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) => updateEducation(edu.id, "institution", e.target.value)}
                    placeholder="Московский государственный университет"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    required
                  />
                </div>

                {/* Уровень образования */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Уровень образования <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={edu.degree}
                    onChange={(e) => updateEducation(edu.id, "degree", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Специальность <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={edu.field}
                    onChange={(e) => updateEducation(edu.id, "field", e.target.value)}
                    placeholder="Компьютерные науки и информатика"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    required
                  />
                </div>

                {/* Годы обучения */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Год начала <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={edu.start_year}
                      onChange={(e) => updateEducation(edu.id, "start_year", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Год окончания
                    </label>
                    <select
                      value={edu.end_year || ""}
                      onChange={(e) => updateEducation(edu.id, "end_year", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
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
            className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-orange-500 hover:text-orange-600 font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Добавить образование
          </button>
        </>
      )}
    </div>
  );
}

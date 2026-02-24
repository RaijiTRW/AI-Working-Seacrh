"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { X } from "lucide-react";

interface SkillsSectionProps {
  data: string;
  onChange: (skills: string) => void;
}

export default function SkillsSection({ data, onChange }: SkillsSectionProps) {
  const [inputValue, setInputValue] = useState("");
  const [skills, setSkills] = useState<string[]>([]);

  // Парсим навыки из строки при загрузке
  useEffect(() => {
    if (data) {
      // Разделяем по запятым, переносам строк и другим разделителям
      const parsed = data
        .split(/[,;\n\r]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      setSkills(parsed);
    }
  }, [data]);

  const addSkill = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !skills.includes(trimmed)) {
      const updated = [...skills, trimmed];
      setSkills(updated);
      onChange(updated.join(", "));
      setInputValue("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const updated = skills.filter((s) => s !== skillToRemove);
    setSkills(updated);
    onChange(updated.join(", "));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    } else if (e.key === "Backspace" && !inputValue && skills.length > 0) {
      // Удаляем последний тег при backspace в пустом поле
      removeSkill(skills[skills.length - 1]);
    }
  };

  // Предложения навыков
  const suggestedSkills = [
    "JavaScript",
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "Python",
    "SQL",
    "Git",
    "Docker",
    "AWS",
    "Figma",
    "Adobe Photoshop",
    "项目管理",
    "Коммуникабельность",
    "Работа в команде",
    "Английский язык (B2)",
  ];

  const addSuggested = (skill: string) => {
    if (!skills.includes(skill)) {
      const updated = [...skills, skill];
      setSkills(updated);
      onChange(updated.join(", "));
    }
  };

  return (
    <div className="space-y-4">
      {/* Теги навыков */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Навыки <span className="text-[#ff6b00]">*</span>
        </label>

        {/* Input с тегами */}
        <div className="bg-black/40 border border-white/10 rounded-lg p-2 focus-within:ring-2 focus-within:ring-[#ff6b00]/50 focus-within:border-[#ff6b00] transition-colors">
          <div className="flex flex-wrap gap-2 mb-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 px-3 py-1 bg-[#ff6b00]/20 text-[#ff6b00] border border-[#ff6b00]/30 rounded-full text-sm"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="ml-1 hover:text-[#ff6b00]/80 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={addSkill}
            placeholder="Введите навык и нажмите Enter..."
            className="w-full bg-transparent outline-none text-sm text-white placeholder-gray-500 mt-1"
          />
        </div>

        <p className="text-xs text-gray-400 mt-1">
          Нажмите Enter или кликните вне поля, чтобы добавить навык
        </p>
      </div>

      {/* Предложения навыков */}
      <div>
        <p className="text-sm font-medium text-gray-300 mb-2">
          Быстрый выбор:
        </p>
        <div className="flex flex-wrap gap-2">
          {suggestedSkills.map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => addSuggested(skill)}
              disabled={skills.includes(skill)}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${skills.includes(skill)
                  ? "bg-white/5 text-gray-500 border-white/10 cursor-not-allowed"
                  : "bg-[#1f2833]/50 text-gray-300 border-white/10 hover:border-[#ff6b00]/50 hover:text-[#ff6b00] hover:bg-white/5 hover:shadow-[0_0_10px_rgba(255,107,0,0.2)]"
                }`}
            >
              {skill}
            </button>
          ))}
        </div>
      </div>

      {/* Категории навыков */}
      <div className="bg-[#00f0ff]/10 rounded-lg p-4 border border-[#00f0ff]/20">
        <h4 className="text-sm font-medium text-[#00f0ff] mb-2">
          💡 Совет: Группируйте навыки по категориям
        </h4>
        <p className="text-xs text-[#00f0ff]/80">
          Пример форматирования:
        </p>
        <div className="mt-2 text-xs text-[#00f0ff]/70 space-y-1">
          <p><strong>Hard Skills:</strong> JavaScript, TypeScript, React, Node.js</p>
          <p><strong>Tools:</strong> Git, Docker, AWS, VS Code</p>
          <p><strong>Soft Skills:</strong> Коммуникабельность, Работа в команде</p>
        </div>
      </div>

      {/* Статистика */}
      {skills.length > 0 && (
        <div className="text-sm text-gray-400">
          Добавлено навыков: {skills.length}
        </div>
      )}
    </div>
  );
}

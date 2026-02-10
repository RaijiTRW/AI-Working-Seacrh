"use client";

import { TemplateId, TEMPLATES } from "@/types/resume";

interface TemplatesSectionProps {
  selectedTemplate: TemplateId;
  onTemplateChange: (templateId: TemplateId) => void;
}

export default function TemplatesSection({
  selectedTemplate,
  onTemplateChange,
}: TemplatesSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Выберите шаблон для вашего резюме
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => onTemplateChange(template.id)}
              className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                selectedTemplate === template.id
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 hover:border-orange-300 hover:bg-gray-50"
              }`}
            >
              {template.is_premium && (
                <span className="absolute top-2 right-2 px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] font-bold rounded">
                  PRO
                </span>
              )}
              <div className="aspect-[210/297] bg-white border border-gray-300 rounded mb-3 p-3 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-400">
                  {template.id === "modern" && "◆"}
                  {template.id === "classic" && "▪"}
                  {template.id === "ats" && "▬"}
                  {template.id === "creative" && "▲"}
                </span>
              </div>
              <h4 className="font-medium text-gray-900 text-sm">
                {template.name_ru}
              </h4>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {template.description}
              </p>
              {selectedTemplate === template.id && (
                <div className="absolute top-2 left-2">
                  <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Current template info */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          💡 О шаблонах
        </h4>
        <div className="text-xs text-blue-800 space-y-2">
          <div>
            <p className="font-medium">Современный</p>
            <p className="text-blue-700">Чистый дизайн с акцентом на навыки. Идеально для IT и креативных профессий.</p>
          </div>
          <div>
            <p className="font-medium">Классический</p>
            <p className="text-blue-700">Традиционный формат для консервативных компаний и банков.</p>
          </div>
          <div>
            <p className="font-medium">ATS-оптимизированный</p>
            <p className="text-blue-700">Максимально совместим с системами автоматического отбора (HR-боты).</p>
          </div>
          <div>
            <p className="font-medium">Креативный</p>
            <p className="text-blue-700">Выразительный дизайн для выделения среди конкурентов (Pro).</p>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          📝 Советы по выбору
        </h4>
        <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
          <li>Используйте ATS-шаблон при отклике через крупные порталы (hh.ru, SuperJob)</li>
          <li>Классический шаблон подходит для традиционных компаний</li>
          <li>Современный шаблон лучше всего для IT и стартапов</li>
          <li>Вы можете сменить шаблон в любой момент без потери данных</li>
        </ul>
      </div>
    </div>
  );
}

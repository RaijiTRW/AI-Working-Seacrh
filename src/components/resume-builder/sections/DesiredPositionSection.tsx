"use client";

interface DesiredPositionSectionProps {
  position: string;
  salary: string;
  onPositionChange: (value: string) => void;
  onSalaryChange: (value: string) => void;
}

export default function DesiredPositionSection({
  position,
  salary,
  onPositionChange,
  onSalaryChange,
}: DesiredPositionSectionProps) {
  return (
    <div className="space-y-4">
      {/* Желаемая должность */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Желаемая должность <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={position}
          onChange={(e) => onPositionChange(e.target.value)}
          placeholder="Frontend-разработчик"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Укажите конкретную должность, которую ищете
        </p>
      </div>

      {/* Желаемая зарплата */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Желаемая зарплата
        </label>
        <div className="flex">
          <input
            type="number"
            value={salary}
            onChange={(e) => onSalaryChange(e.target.value)}
            placeholder="100000"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
          <span className="inline-flex items-center px-4 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-gray-600">
            ₽/мес
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Можно оставить пустым, если не хотите указывать
        </p>

        {/* Подсказки по зарплате */}
        <div className="mt-3 bg-blue-50 rounded-lg p-3 border border-blue-100">
          <p className="text-xs text-blue-800">
            💡 Исследование рынка: Средние зарплаты по Москве (2024)
          </p>
          <ul className="text-xs text-blue-700 mt-2 space-y-1">
            <li>• Junior: 50 000 - 100 000 ₽</li>
            <li>• Middle: 100 000 - 200 000 ₽</li>
            <li>• Senior: 200 000 - 400 000 ₽</li>
          </ul>
        </div>
      </div>

      {/* Советы */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          💡 Советы по заполнению:
        </h4>
        <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
          <li>Указывайте конкретную должность, а не "любая работа"</li>
          <li>Избегайте слишком общих формулировок</li>
          <li>Зарплату лучше указывать "на руки" (net)</li>
          <li>Можно добавить диапазон: "100 000 - 150 000"</li>
        </ul>
      </div>
    </div>
  );
}

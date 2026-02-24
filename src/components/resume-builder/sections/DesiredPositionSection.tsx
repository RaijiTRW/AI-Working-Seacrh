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
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Желаемая должность <span className="text-[#ff6b00]">*</span>
        </label>
        <input
          type="text"
          value={position}
          onChange={(e) => onPositionChange(e.target.value)}
          placeholder="Frontend-разработчик"
          className="w-full px-4 py-2 bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50 focus:border-[#ff6b00] transition-colors"
          required
        />
        <p className="text-xs text-gray-400 mt-1">
          Укажите конкретную должность, которую ищете
        </p>
      </div>

      {/* Желаемая зарплата */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Желаемая зарплата
        </label>
        <div className="flex">
          <input
            type="number"
            value={salary}
            onChange={(e) => onSalaryChange(e.target.value)}
            placeholder="100000"
            className="flex-1 px-4 py-2 bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50 focus:border-[#ff6b00] transition-colors"
          />
          <span className="inline-flex items-center px-4 bg-white/5 border border-l-0 border-white/10 rounded-r-lg text-gray-400">
            ₽/мес
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Можно оставить пустым, если не хотите указывать
        </p>

        {/* Подсказки по зарплате */}
        <div className="mt-3 bg-[#00f0ff]/10 rounded-lg p-3 border border-[#00f0ff]/20">
          <p className="text-xs text-[#00f0ff] font-medium">
            💡 Исследование рынка: Средние зарплаты по Москве (2024)
          </p>
          <ul className="text-xs text-[#00f0ff]/80 mt-2 space-y-1">
            <li>• Junior: 50 000 - 100 000 ₽</li>
            <li>• Middle: 100 000 - 200 000 ₽</li>
            <li>• Senior: 200 000 - 400 000 ₽</li>
          </ul>
        </div>
      </div>

      {/* Советы */}
      <div className="bg-[#1f2833]/50 backdrop-blur-md rounded-lg p-4 border border-white/10">
        <h4 className="text-sm font-medium text-white mb-2">
          💡 Советы по заполнению:
        </h4>
        <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
          <li>Указывайте конкретную должность, а не "любая работа"</li>
          <li>Избегайте слишком общих формулировок</li>
          <li>Зарплату лучше указывать "на руки" (net)</li>
          <li>Можно добавить диапазон: "100 000 - 150 000"</li>
        </ul>
      </div>
    </div>
  );
}

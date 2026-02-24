"use client";

import AIImprovementButton from "../AIImprovementButton";

interface AboutSectionProps {
  data: string;
  onChange: (value: string) => void;
  userId?: string;
  isPro?: boolean;
  isProTrial?: boolean;
}

export default function AboutSection({
  data,
  onChange,
  userId,
  isPro,
  isProTrial
}: AboutSectionProps) {
  const charCount = data.length;
  const recommendedMin = 200;
  const recommendedMax = 500;

  const getCountStatus = () => {
    if (charCount < recommendedMin) {
      return { text: `Слишком коротко (минимум ${recommendedMin} символов)`, color: "text-[#ff6b00]" };
    }
    if (charCount > recommendedMax) {
      return { text: `Слишком длинно (максимум ${recommendedMax} символов)`, color: "text-[#ff6b00]" };
    }
    return { text: "Оптимальная длина", color: "text-[#00f0ff]" };
  };

  const status = getCountStatus();

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-300">
            О себе
          </label>
          {userId && data && (
            <AIImprovementButton
              text={data}
              field="about"
              userId={userId}
              isPro={isPro}
              isProTrial={isProTrial}
              onTextApply={onChange}
              className="text-xs"
            />
          )}
        </div>
        <textarea
          value={data}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Расскажите о себе..."
          rows={10}
          className="w-full px-4 py-3 bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50 focus:border-[#ff6b00] resize-none custom-scrollbar transition-colors"
        />
      </div>

      {/* Счетчик символов */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">
          Символов: {charCount}
        </span>
        <span className={status.color}>
          {status.text}
        </span>
      </div>

      {/* Советы */}
      <div className="bg-[#00f0ff]/10 rounded-lg p-4 border border-[#00f0ff]/20">
        <h4 className="text-sm font-medium text-[#00f0ff] mb-2">
          💡 Как написать хорошее описание:
        </h4>
        <ul className="text-xs text-[#00f0ff]/80 space-y-1 list-disc list-inside">
          <li>Избегайте клише: "командный игрок", "стрессоустойчивый"</li>
          <li>Покажите, а не расскажите: вместо "ответственный" напишите "выполнил 20+ проектов в срок"</li>
          <li>Используйте конкретные результаты: "увеличил продажи на 30%"</li>
          <li>Упомяните ключевые достижения последних 3-5 лет</li>
          <li>Адаптируйте описание под желаемую должность</li>
        </ul>
      </div>

      {/* Примеры */}
      <div className="bg-[#1f2833]/50 backdrop-blur-md rounded-lg p-4 border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
        <h4 className="text-sm font-medium text-white mb-2">
          ✅ Хороший пример:
        </h4>
        <p className="text-xs text-gray-300 italic">
          Frontend-разработчик с 4-летним опытом. Специализируюсь на React и Next.js.
          За последний год разработал 3 крупных коммерческих проекта, один из которых
          увеличил конверсию клиента на 25%. Увлекаюсь opensource, имею 500+ звезд на GitHub.
          Владею английским на уровне B2, могу работать в международной команде.
        </p>

        <h4 className="text-sm font-medium text-white mt-3 mb-2">
          ❌ Плохой пример:
        </h4>
        <p className="text-xs text-gray-400 italic">
          Командный игрок, ответственный, communicable, без вредных привычек.
          Ищу работу для самореализации и роста в компании.
        </p>
      </div>
    </div>
  );
}

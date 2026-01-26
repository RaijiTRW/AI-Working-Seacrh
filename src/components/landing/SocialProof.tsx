"use client";

const stats = [
  {
    value: "2,340+",
    label: "вакансий в базе",
    subLabel: "обновляется каждые 2 часа",
  },
  {
    value: "87%",
    label: "нерелевантных отфильтровано",
    subLabel: "дубликаты, фейки, неактуальные",
  },
  {
    value: "5 мин",
    label: "до первых вакансий",
    subLabel: "от регистрации до результата",
  },
  {
    value: "5+",
    label: "площадок сканируем",
    subLabel: "hh, Avito, SuperJob и другие",
  },
];

export default function SocialProof() {
  return (
    <section className="py-16 md:py-20 px-4 sm:px-6 bg-gradient-to-r from-orange-500 to-orange-600">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center text-white">
              <div className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2">
                {stat.value}
              </div>
              <div className="text-sm md:text-base font-medium opacity-90 mb-1">
                {stat.label}
              </div>
              <div className="text-xs opacity-70">
                {stat.subLabel}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

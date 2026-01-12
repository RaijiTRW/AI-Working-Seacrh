const steps = [
  {
    number: "1",
    title: "Расскажи что ищешь",
    description: "ИИ задаёт вопросы: город, сфера, опыт, чтобы знать что искать",
  },
  {
    number: "2",
    title: "Мы ищем вакансий",
    description: "Смотрим Avito, hh, SuperJob и другие площадки",
  },
  {
    number: "3",
    title: "Получаешь только лучшее",
    description: "5-15 отфильтрованных вакансий без дубликатов",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 bg-gradient-to-b from-white via-gray-50/50 to-gray-50">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-10 md:mb-16">
          Как это работает
        </h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center text-lg md:text-xl font-bold mx-auto mb-4 md:mb-6 shadow-lg shadow-orange-500/25">
                {step.number}
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-2 md:mb-3">{step.title}</h3>
              <p className="text-sm md:text-base text-muted">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

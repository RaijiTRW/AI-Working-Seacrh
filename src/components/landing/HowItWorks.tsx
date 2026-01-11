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
    description: "5-15 отфильтрованных вакансий без мусора и дубликатов",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 px-6 bg-gradient-to-b from-white via-gray-50/50 to-gray-50">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
          Как это работает
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6 shadow-lg shadow-orange-500/25">
                {step.number}
              </div>
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-muted">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

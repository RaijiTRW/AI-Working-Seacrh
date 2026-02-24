export default function EmployerHowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Создайте вакансию",
      description: "Заполните простую форму с описанием позиции, требованиями и условиями работы.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      number: "02",
      title: "AI фильтрует кандидатов",
      description: "Наш искусственный интеллект анализирует резюме и отбирает подходящих соискателей.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      number: "03",
      title: "Общайтесь с кандидатами",
      description: "Используйте встроенный чат для связи с соискателями и назначайте собеседования.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-20 px-6 bg-[#0b0c10] relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 pointer-events-none" />

      {/* Decorative blurred circles */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-[#00f0ff] rounded-full mix-blend-screen filter blur-[150px] opacity-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-[#ff6b00] rounded-full mix-blend-screen filter blur-[150px] opacity-10 pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            Как это работает
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Три простых шага до найма идеального кандидата
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting line (hidden on mobile) */}
          <div className="hidden md:block absolute top-[110px] left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-[#00f0ff]/30 to-transparent -z-10" />

          {steps.map((step, index) => (
            <div
              key={index}
              className="relative group"
            >
              <div className="relative bg-[#1f2833]/50 backdrop-blur-xl rounded-2xl p-8 shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-white/10 group-hover:border-[#00f0ff]/50 group-hover:shadow-[0_0_30px_rgba(0,240,255,0.15)] transition-all duration-300 h-full">
                {/* Number badge */}
                <div className="absolute -top-5 -right-5 w-14 h-14 rounded-full bg-gradient-to-br from-[#00f0ff] to-[#00b8ff] text-black font-bold flex items-center justify-center text-xl shadow-[0_0_20px_rgba(0,240,255,0.5)] group-hover:scale-110 transition-transform duration-300 border-4 border-[#0b0c10]">
                  {step.number}
                </div>

                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-[#00f0ff]/10 text-[#00f0ff] flex items-center justify-center mb-6 border border-[#00f0ff]/20 group-hover:bg-[#00f0ff]/20 transition-colors">
                  {step.icon}
                </div>

                <h3 className="text-xl font-bold text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

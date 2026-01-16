interface FooterProps {
  mode?: "jobseeker" | "employer";
}

export default function Footer({ mode = "jobseeker" }: FooterProps) {
  const content = {
    jobseeker: {
      title: "Готов найти работу без головной боли?",
      subtitle: "Начни бесплатно — первый подбор за нас.",
      cta: "Попробовать бесплатно",
      ctaLink: "/auth",
      ctaColor: "from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-500/25 hover:shadow-orange-500/30",
    },
    employer: {
      title: "Готовы найти лучших кандидатов?",
      subtitle: "Начните бесплатно — разместите первую вакансию.",
      cta: "Разместить вакансию",
      ctaLink: "/auth",
      ctaColor: "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/25 hover:shadow-blue-500/30",
    },
  };

  const currentContent = content[mode];

  return (
    <footer id="cta" className="py-16 md:py-24 px-4 sm:px-6 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 md:mb-6">
          {currentContent.title}
        </h2>
        <p className="text-base md:text-lg text-muted mb-8 md:mb-10">
          {currentContent.subtitle}
        </p>
        <a
          href={currentContent.ctaLink}
          className={`inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r ${currentContent.ctaColor} text-white rounded-full text-base md:text-lg font-medium transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 mb-12 md:mb-16`}
        >
          {currentContent.cta}
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
        <div className="border-t border-gray-200 pt-6 md:pt-8 text-xs md:text-sm text-muted">
          <p>Контакты: telegram / email (добавить позже)</p>
          <p className="mt-2">2026 Job Search Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}

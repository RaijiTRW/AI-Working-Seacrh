export default function Footer() {
  return (
    <footer id="cta" className="py-16 md:py-24 px-4 sm:px-6 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 md:mb-6">
          Готов найти работу без головной боли?
        </h2>
        <p className="text-base md:text-lg text-muted mb-8 md:mb-10">
          Начни бесплатно — первый подбор за нас.
        </p>
        <a
          href="/auth"
          className="inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full text-base md:text-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5 mb-12 md:mb-16"
        >
          Попробовать бесплатно
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

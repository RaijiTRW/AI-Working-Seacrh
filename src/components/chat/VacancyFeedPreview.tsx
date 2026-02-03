"use client";

interface VacancyFeedPreviewProps {
  isBlurred: boolean;
  overlayText?: string;
}

/**
 * Компонент для показа превью ленты вакансий во время поиска.
 * Показывает скелетоны карточек с размытием и оверлей текстом.
 */
export default function VacancyFeedPreview({ isBlurred, overlayText }: VacancyFeedPreviewProps) {
  return (
    <div className="ml-11 relative">
      {/* Скелетоны карточек */}
      <div
        className={`flex gap-4 transition-all duration-500 ${isBlurred ? 'animate-blur-in' : ''}`}
        style={{ filter: isBlurred ? 'blur(8px)' : 'none' }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-shrink-0 w-72 bg-white rounded-2xl border border-gray-200 p-4"
          >
            {/* Source badge skeleton */}
            <div className="flex items-center justify-between mb-3">
              <div className="w-16 h-6 bg-gray-200 rounded-full animate-pulse" />
              <div className="w-12 h-4 bg-gray-100 rounded" />
            </div>

            {/* Title skeleton */}
            <div className="w-full h-6 bg-gray-200 rounded mb-2 animate-pulse" />

            {/* Company skeleton */}
            <div className="w-3/4 h-4 bg-gray-100 rounded mb-3 animate-pulse" />

            {/* Salary skeleton */}
            <div className="w-1/2 h-6 bg-orange-100 rounded mb-2 animate-pulse" />

            {/* City & experience skeleton */}
            <div className="flex items-center gap-2">
              <div className="w-20 h-3 bg-gray-100 rounded animate-pulse" />
              <div className="w-px h-3 bg-gray-200" />
              <div className="w-16 h-3 bg-gray-100 rounded animate-pulse" />
            </div>

            {/* Description skeleton */}
            <div className="mt-3 space-y-1">
              <div className="w-full h-3 bg-gray-50 rounded animate-pulse" />
              <div className="w-2/3 h-3 bg-gray-50 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Overlay text */}
      {isBlurred && overlayText && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
            <p className="text-gray-700 font-medium animate-pulse-subtle flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {overlayText}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

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
    <div className="ml-14 relative overflow-hidden py-2" style={{ maskImage: 'linear-gradient(to right, black 80%, transparent 100%)' }}>
      {/* Скелетоны карточек */}
      <div
        className={`flex gap-5 transition-all duration-700 ease-in-out ${isBlurred ? 'animate-blur-in' : ''}`}
        style={{ filter: isBlurred ? 'blur(10px) brightness(0.6)' : 'none' }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-shrink-0 w-80 bg-[#1f2833]/20 border border-[#c5c6c7]/5 rounded-2xl p-5"
          >
            {/* Source badge skeleton */}
            <div className="flex items-center justify-between mb-4">
              <div className="w-20 h-6 bg-[#c5c6c7]/5 rounded m-0 animate-pulse" />
              <div className="w-14 h-4 bg-[#c5c6c7]/5 rounded m-0" />
            </div>

            {/* Title skeleton */}
            <div className="w-full h-7 bg-[#c5c6c7]/10 rounded mb-3 animate-pulse" />

            {/* Company skeleton */}
            <div className="w-2/3 h-5 bg-[#c5c6c7]/5 rounded mb-5 animate-pulse" />

            {/* Salary skeleton */}
            <div className="w-1/2 h-7 bg-[#00f0ff]/10 rounded mb-4 animate-pulse" />

            {/* City & experience skeleton */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-24 h-4 bg-[#c5c6c7]/5 rounded animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-[#c5c6c7]/10" />
              <div className="w-16 h-4 bg-[#c5c6c7]/5 rounded animate-pulse" />
            </div>

            {/* Description skeleton */}
            <div className="mt-4 space-y-2">
              <div className="w-full h-3 bg-[#c5c6c7]/5 rounded animate-pulse" />
              <div className="w-5/6 h-3 bg-[#c5c6c7]/5 rounded animate-pulse" />
              <div className="w-2/3 h-3 bg-[#c5c6c7]/5 rounded animate-pulse" />
            </div>

            <div className="mt-6 pt-4 border-t border-[#c5c6c7]/5 flex justify-between">
              <div className="w-1/3 h-3 bg-[#c5c6c7]/5 rounded" />
              <div className="w-1/4 h-3 bg-[#c5c6c7]/10 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Overlay text */}
      {isBlurred && overlayText && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-[#0b0c10]/80 backdrop-blur-xl border border-[#00f0ff]/30 px-8 py-4 rounded-xl shadow-[0_0_30px_rgba(0,240,255,0.2)] flex items-center gap-4">
            <div className="relative w-6 h-6">
              <div className="absolute inset-0 border-2 border-[#00f0ff]/20 rounded-full" />
              <div className="absolute inset-0 border-2 border-[#00f0ff] border-t-transparent rounded-full animate-spin shadow-[0_0_10px_rgba(0,240,255,0.5)]" />
            </div>
            <p className="text-[#00f0ff] font-bold text-sm uppercase tracking-widest drop-shadow-[0_0_8px_rgba(0,240,255,0.6)] animate-pulse-subtle">
              {overlayText}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

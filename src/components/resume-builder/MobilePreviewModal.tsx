"use client";

import { X, Download, ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Resume } from "@/types/resume";
import { ModernTemplate } from "./templates/ModernTemplate";
import { ClassicTemplate } from "./templates/ClassicTemplate";
import { ATSTemplate } from "./templates/ATSTemplate";
import { CreativeTemplate } from "./templates/CreativeTemplate";
import PaginatedResumePages, {
  MAX_RESUME_PAGES,
  type ResumePaginationInfo,
} from "./PaginatedResumePages";

interface MobilePreviewModalProps {
  resume: Resume;
  currentTemplate: string;
  onExportPDF: () => void;
  exportingPDF: boolean;
  onClose: () => void;
}

export default function MobilePreviewModal({
  resume,
  currentTemplate,
  onExportPDF,
  exportingPDF,
  onClose,
}: MobilePreviewModalProps) {
  const [zoom, setZoom] = useState(42);
  const [paginationInfo, setPaginationInfo] = useState<ResumePaginationInfo>({
    requiredPages: 1,
    renderedPages: 1,
    isOverflowing: false,
  });
  const MIN_ZOOM = 30;
  const MAX_ZOOM = 150;

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 10, MAX_ZOOM));
  }, [MAX_ZOOM]);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 10, MIN_ZOOM));
  }, [MIN_ZOOM]);

  const renderTemplate = useCallback(() => {
    switch (currentTemplate) {
      case "modern":
        return <ModernTemplate resume={resume} />;
      case "classic":
        return <ClassicTemplate resume={resume} />;
      case "ats":
        return <ATSTemplate resume={resume} />;
      case "creative":
        return <CreativeTemplate resume={resume} />;
      default:
        return <ModernTemplate resume={resume} />;
    }
  }, [currentTemplate, resume]);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-3 z-10">
        <button
          onClick={onClose}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Close preview"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= MIN_ZOOM}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-sm text-gray-600 min-w-[50px] text-center font-medium">
            {zoom}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={zoom >= MAX_ZOOM}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <button
          onClick={onExportPDF}
          disabled={exportingPDF}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exportingPDF ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="sr-only">Exporting PDF</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              PDF
            </>
          )}
        </button>
      </div>

      {/* Preview area */}
      <div className="h-full overflow-auto p-4 pt-20 bg-gray-900">
        <PaginatedResumePages
          renderTemplate={renderTemplate}
          zoom={zoom}
          previewWrapperId="resume-preview-wrapper-mobile"
          previewId="resume-preview-mobile"
          maxPages={MAX_RESUME_PAGES}
          onPaginationChange={setPaginationInfo}
        />
      </div>

      {/* Page info */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-2 text-center text-xs text-gray-500">
        Формат A4 (210 × 297 мм) • Масштаб: {zoom}% • Страницы: {paginationInfo.renderedPages}
        {paginationInfo.isOverflowing ? ` из ${paginationInfo.requiredPages}` : ""}
      </div>
      {paginationInfo.isOverflowing && (
        <div className="fixed bottom-9 left-0 right-0 bg-amber-50 border-t border-amber-200 px-4 py-2 text-center text-[10px] text-amber-700">
          Показаны первые {MAX_RESUME_PAGES} страницы из {paginationInfo.requiredPages}.
        </div>
      )}
    </div>
  );
}

"use client";

import { Resume } from "@/types/resume";
import { ModernTemplate } from "./templates/ModernTemplate";
import { ClassicTemplate } from "./templates/ClassicTemplate";
import { ATSTemplate } from "./templates/ATSTemplate";
import { CreativeTemplate } from "./templates/CreativeTemplate";
import { Download, ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useBreakpoint } from "@/hooks/useBreakpoint";

interface ResumePreviewProps {
  resume: Resume;
  onTemplateChange?: (templateId: string) => void;
  onExportPDF?: () => void;
  currentTemplate?: string;
  showTemplateSelector?: boolean;
  exportingPDF?: boolean;
}

export interface ResumePreviewRef {
  getPreviewElement: () => HTMLDivElement | null;
}

export default function ResumePreview({
  resume,
  onTemplateChange,
  onExportPDF,
  currentTemplate = "modern",
  showTemplateSelector = true,
  exportingPDF = false,
}: ResumePreviewProps) {
  const [zoom, setZoom] = useState(100);
  const previewRef = useRef<HTMLDivElement>(null);
  const breakpoint = useBreakpoint();
  const MIN_ZOOM = 30;
  const MAX_ZOOM = 150;

  // Reset zoom on breakpoint change for better UX
  useEffect(() => {
    if (breakpoint.isMobile) {
      setZoom(42);
    } else if (breakpoint.isTablet) {
      setZoom(52);
    } else {
      setZoom(45);
    }
  }, [breakpoint.isMobile, breakpoint.isTablet, breakpoint.isDesktop]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 10, MAX_ZOOM));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 10, MIN_ZOOM));
  };

  const renderTemplate = () => {
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
  };

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-3 sm:px-4 py-2 sm:py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
        {/* Template selector */}
        {showTemplateSelector && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm text-gray-600 whitespace-nowrap hidden sm:inline">Шаблон:</span>
            <select
              value={currentTemplate}
              onChange={(e) => onTemplateChange?.(e.target.value)}
              className="flex-1 sm:flex-none px-2 sm:px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            >
              <option value="modern">Современный</option>
              <option value="classic">Классический</option>
              <option value="ats">ATS-оптимизированный</option>
              <option value="creative">Креативный ✨</option>
            </select>
          </div>
        )}

        {/* Zoom controls and Export */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= MIN_ZOOM}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Уменьшить"
            >
              <ZoomOut className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-sm text-gray-600 min-w-[45px] sm:min-w-[50px] text-center">{zoom}%</span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= MAX_ZOOM}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Увеличить"
            >
              <ZoomIn className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Export button */}
          <button
            onClick={onExportPDF}
            disabled={exportingPDF}
            className="flex items-center gap-2 px-3 sm:px-4 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportingPDF ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Экспорт...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Скачать PDF</span>
                <span className="sm:hidden">PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto p-3 sm:p-6">
        <div className="w-max mx-auto">
          <div
            ref={previewRef}
            id="resume-preview-wrapper"
            className="bg-white shadow-2xl transition-transform origin-top"
            style={{
              width: "794px",
              height: "1123px",
              transform: `scale(${zoom / 100})`,
            }}
          >
            {/* Inner element for PDF export - no transform, let content determine height */}
            <div id="resume-preview" style={{ width: "794px", minHeight: "1123px" }}>
              {renderTemplate()}
            </div>
          </div>
        </div>
      </div>

      {/* Page info */}
      <div className="bg-white border-t border-gray-200 px-3 sm:px-4 py-2 text-center text-[10px] sm:text-xs text-gray-500">
        Формат A4 (210 × 297 мм) • Масштаб: {zoom}%
      </div>
    </div>
  );
}

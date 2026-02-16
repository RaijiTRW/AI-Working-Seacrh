"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

export const A4_WIDTH_PX = 794;
export const A4_HEIGHT_PX = 1123;
export const MAX_RESUME_PAGES = 4;
const MIN_PAGE_ADVANCE_PX = Math.floor(A4_HEIGHT_PX * 0.72);

export interface ResumePaginationInfo {
  requiredPages: number;
  renderedPages: number;
  isOverflowing: boolean;
}

interface PaginatedResumePagesProps {
  renderTemplate: () => ReactNode;
  zoom: number;
  previewWrapperId: string;
  previewId: string;
  maxPages?: number;
  onPaginationChange?: (info: ResumePaginationInfo) => void;
}

export default function PaginatedResumePages({
  renderTemplate,
  zoom,
  previewWrapperId,
  previewId,
  maxPages = MAX_RESUME_PAGES,
  onPaginationChange,
}: PaginatedResumePagesProps) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [requiredPages, setRequiredPages] = useState(1);
  const [renderedPages, setRenderedPages] = useState(1);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [pageBoundaries, setPageBoundaries] = useState<number[]>([0, A4_HEIGHT_PX]);

  const buildPageBoundaries = useCallback((sectionStarts: number[], contentHeight: number) => {
    const boundaries = [0];
    let currentStart = 0;

    while (currentStart < contentHeight) {
      const pageLimit = currentStart + A4_HEIGHT_PX;
      if (pageLimit >= contentHeight) {
        boundaries.push(contentHeight);
        break;
      }

      const minBoundary = Math.min(contentHeight, currentStart + MIN_PAGE_ADVANCE_PX);
      const candidateStarts = sectionStarts.filter(
        (value) =>
          value > currentStart + 1 &&
          value >= minBoundary &&
          value <= pageLimit
      );

      const nextBoundary =
        candidateStarts.length > 0
          ? candidateStarts[candidateStarts.length - 1]
          : pageLimit;

      const safeBoundary = Math.min(contentHeight, Math.max(currentStart + 1, nextBoundary));
      boundaries.push(safeBoundary);
      currentStart = safeBoundary;
    }

    return boundaries;
  }, []);

  const updatePagination = useCallback(() => {
    const measureNode = measureRef.current;
    if (!measureNode) return;

    const rootNode = measureNode.firstElementChild as HTMLElement | null;
    const measuredHeight = Math.max(
      A4_HEIGHT_PX,
      Math.ceil((rootNode || measureNode).scrollHeight),
      Math.ceil((rootNode || measureNode).getBoundingClientRect().height)
    );

    let boundaries = [0, measuredHeight];
    if (rootNode && rootNode.children.length > 0) {
      const directStarts = Array.from(rootNode.children).map((node) =>
        Math.max(0, Math.floor((node as HTMLElement).offsetTop))
      );

      const semanticStarts = Array.from(
        rootNode.querySelectorAll<HTMLElement>("h2, [data-page-break='true']")
      ).map((node) => Math.max(0, Math.floor(node.offsetTop)));

      const uniqueStarts = Array.from(
        new Set([0, ...directStarts, ...semanticStarts])
      ).sort((a, b) => a - b);

      boundaries = buildPageBoundaries(uniqueStarts, measuredHeight);
    } else {
      const pagesNeeded = Math.max(1, Math.ceil(measuredHeight / A4_HEIGHT_PX));
      boundaries = Array.from({ length: pagesNeeded + 1 }, (_, i) =>
        Math.min(measuredHeight, i * A4_HEIGHT_PX)
      );
    }

    const pagesNeeded = Math.max(1, boundaries.length - 1);
    const pagesShown = Math.min(maxPages, pagesNeeded);
    const overflow = pagesNeeded > maxPages;

    setPageBoundaries((prev) =>
      prev.length === boundaries.length && prev.every((value, idx) => value === boundaries[idx])
        ? prev
        : boundaries
    );
    setRequiredPages((prev) => (prev === pagesNeeded ? prev : pagesNeeded));
    setRenderedPages((prev) => (prev === pagesShown ? prev : pagesShown));
    setIsOverflowing((prev) => (prev === overflow ? prev : overflow));
  }, [buildPageBoundaries, maxPages]);

  useEffect(() => {
    const measureNode = measureRef.current;
    if (!measureNode) return;

    const raf = window.requestAnimationFrame(updatePagination);
    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(updatePagination);
    });
    observer.observe(measureNode);

    const images = Array.from(measureNode.querySelectorAll("img"));
    const handleImageChange = () => updatePagination();
    images.forEach((img) => {
      img.addEventListener("load", handleImageChange);
      img.addEventListener("error", handleImageChange);
    });

    return () => {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
      images.forEach((img) => {
        img.removeEventListener("load", handleImageChange);
        img.removeEventListener("error", handleImageChange);
      });
    };
  }, [updatePagination, renderTemplate]);

  useEffect(() => {
    onPaginationChange?.({
      requiredPages,
      renderedPages,
      isOverflowing,
    });
  }, [requiredPages, renderedPages, isOverflowing, onPaginationChange]);

  const pages = Array.from({ length: renderedPages }, (_, pageIndex) => {
    const pageStart = pageBoundaries[pageIndex] ?? pageIndex * A4_HEIGHT_PX;
    const pageEnd = pageBoundaries[pageIndex + 1] ?? pageStart + A4_HEIGHT_PX;
    const visibleHeight = Math.max(1, Math.min(A4_HEIGHT_PX, pageEnd - pageStart));
    return { pageIndex, pageStart, visibleHeight };
  });

  return (
    <div className="w-max mx-auto">
      <div
        id={previewWrapperId}
        className="transition-transform origin-top"
        style={{
          width: `${A4_WIDTH_PX}px`,
          transform: `scale(${zoom / 100})`,
        }}
      >
        <div
          id={previewId}
          data-resume-preview-pages="true"
          data-required-pages={requiredPages}
          data-rendered-pages={renderedPages}
          data-overflow={isOverflowing ? "true" : "false"}
          style={{ width: `${A4_WIDTH_PX}px` }}
        >
          {pages.map(({ pageIndex, pageStart, visibleHeight }) => (
            <div
              key={`resume-page-${pageIndex + 1}`}
              data-resume-page="true"
              data-page-number={pageIndex + 1}
              className={`relative overflow-hidden bg-white border border-gray-300 shadow-2xl ${pageIndex < renderedPages - 1 ? "mb-6" : ""}`}
              style={{
                width: `${A4_WIDTH_PX}px`,
                height: `${A4_HEIGHT_PX}px`,
              }}
            >
              <div style={{ height: `${visibleHeight}px`, overflow: "hidden" }}>
                <div style={{ transform: `translateY(-${pageStart}px)` }}>
                  {renderTemplate()}
                </div>
              </div>
              {visibleHeight < A4_HEIGHT_PX && (
                <div
                  style={{
                    height: `${A4_HEIGHT_PX - visibleHeight}px`,
                    backgroundColor: "#ffffff",
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="pointer-events-none fixed -left-[10000px] top-0 opacity-0" aria-hidden="true">
        <div ref={measureRef} style={{ width: `${A4_WIDTH_PX}px` }}>
          {renderTemplate()}
        </div>
      </div>
    </div>
  );
}

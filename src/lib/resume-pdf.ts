// PDF generation utilities for Resume Builder
// Использует html2canvas и jspdf для создания PDF

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MAX_PDF_PAGES = 4;
const PDF_EXPORT_ATTR = "data-pdf-export-root";

type ProgressCallback = (progress: number) => void;

/**
 * Временный класс для переопределения oklch цветов
 */
const PDF_OVERRIDE_STYLES = `
  .pdf-export .bg-orange-50 { background-color: #fff7ed !important; }
  .pdf-export .bg-orange-100 { background-color: #ffedd5 !important; }
  .pdf-export .bg-orange-500 { background-color: #f97316 !important; }
  .pdf-export .bg-orange-600 { background-color: #ea580c !important; }
  .pdf-export .text-orange-500 { color: #f97316 !important; }
  .pdf-export .text-orange-600 { color: #ea580c !important; }
  .pdf-export .text-orange-700 { color: #c2410c !important; }
  .pdf-export .border-orange-500 { border-color: #f97316 !important; }
  .pdf-export .hover\\:bg-orange-600:hover { background-color: #ea580c !important; }
  .pdf-export .hover\\:text-orange-600:hover { color: #ea580c !important; }
  .pdf-export .focus\\:ring-orange-500\\/20:focus { --tw-ring-color: rgb(251 146 60 / 0.2) !important; }
  .pdf-export .focus\\:border-orange-500:focus { border-color: #f97316 !important; }

  /* Gray colors */
  .pdf-export .bg-gray-50 { background-color: #f9fafb !important; }
  .pdf-export .bg-gray-100 { background-color: #f3f4f6 !important; }
  .pdf-export .bg-gray-200 { background-color: #e5e7eb !important; }
  .pdf-export .bg-gray-300 { background-color: #d1d5db !important; }
  .pdf-export .bg-gray-500 { background-color: #6b7280 !important; }
  .pdf-export .bg-gray-700 { background-color: #374151 !important; }
  .pdf-export .bg-gray-800 { background-color: #1f2937 !important; }
  .pdf-export .bg-gray-900 { background-color: #111827 !important; }
  .pdf-export .text-gray-400 { color: #9ca3af !important; }
  .pdf-export .text-gray-500 { color: #6b7280 !important; }
  .pdf-export .text-gray-600 { color: #4b5563 !important; }
  .pdf-export .text-gray-700 { color: #374151 !important; }
  .pdf-export .text-gray-800 { color: #1f2937 !important; }
  .pdf-export .text-gray-900 { color: #111827 !important; }
  .pdf-export .border-gray-200 { border-color: #e5e7eb !important; }
  .pdf-export .border-gray-300 { border-color: #d1d5db !important; }
  .pdf-export .border-gray-400 { border-color: #9ca3af !important; }

  /* Other colors */
  .pdf-export .text-white { color: #ffffff !important; }
  .pdf-export .text-red-500 { color: #ef4444 !important; }
  .pdf-export .text-red-600 { color: #dc2626 !important; }
  .pdf-export .text-blue-500 { color: #3b82f6 !important; }
  .pdf-export .text-blue-600 { color: #2563eb !important; }
  .pdf-export .text-blue-800 { color: #1e40af !important; }
  .pdf-export .bg-blue-50 { background-color: #eff6ff !important; }
  .pdf-export .bg-blue-100 { background-color: #dbeafe !important; }
  .pdf-export .bg-blue-500 { background-color: #3b82f6 !important; }
  .pdf-export .border-blue-200 { border-color: #bfdbfe !important; }
  .pdf-export .border-blue-500 { border-color: #3b82f6 !important; }
`;

function ensureElementCanBeExported(element: HTMLElement): void {
  if (!element) {
    throw new Error("Element not found");
  }

  if (!element.isConnected) {
    throw new Error("Element is not connected to the DOM");
  }

  if (element.children.length === 0 || element.innerHTML.trim().length < 100) {
    throw new Error(
      `Element appears to be empty (children: ${element.children.length}, innerHTML length: ${element.innerHTML.length})`
    );
  }
}

function isStylableElement(element: Element): element is HTMLElement | SVGElement {
  return element instanceof HTMLElement || element instanceof SVGElement;
}

function copyComputedStyle(sourceEl: Element, targetEl: Element): void {
  if (!isStylableElement(sourceEl) || !isStylableElement(targetEl)) {
    return;
  }

  const computedStyle = window.getComputedStyle(sourceEl);
  for (let i = 0; i < computedStyle.length; i += 1) {
    const property = computedStyle.item(i);

    // CSS custom properties in Tailwind v4 can hold oklch() values and crash html2canvas parser.
    if (!property || property.startsWith("--")) {
      continue;
    }

    const value = computedStyle.getPropertyValue(property);
    if (!value || value.includes("oklch(")) {
      continue;
    }

    targetEl.style.setProperty(property, value, computedStyle.getPropertyPriority(property));
  }
}

function inlineComputedStyles(sourceRoot: Element, targetRoot: Element): void {
  copyComputedStyle(sourceRoot, targetRoot);

  const sourceChildren = Array.from(sourceRoot.children);
  const targetChildren = Array.from(targetRoot.children);
  const length = Math.min(sourceChildren.length, targetChildren.length);

  for (let i = 0; i < length; i += 1) {
    inlineComputedStyles(sourceChildren[i], targetChildren[i]);
  }
}

function collectFontFaceRules(): string {
  const chunks: string[] = [];

  for (const styleSheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = styleSheet.cssRules;
    } catch {
      // Cross-origin stylesheet. Skip silently.
      continue;
    }

    for (const rule of Array.from(rules)) {
      if (rule.type === CSSRule.FONT_FACE_RULE) {
        chunks.push(rule.cssText);
      }
    }
  }

  return chunks.join("\n");
}

async function waitForFontsReady(doc: Document, timeoutMs: number = 5000): Promise<void> {
  const fontSet = doc.fonts;
  if (!fontSet) {
    return;
  }

  await Promise.race([
    fontSet.ready.then(() => undefined).catch(() => undefined),
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, timeoutMs);
    }),
  ]);
}

function prepareImageForExport(img: HTMLImageElement): void {
  const rawSrc = img.getAttribute("src");
  if (!rawSrc) {
    return;
  }

  if (rawSrc.startsWith("data:") || rawSrc.startsWith("blob:")) {
    return;
  }

  try {
    const resolvedUrl = new URL(rawSrc, window.location.href);

    if (resolvedUrl.protocol !== "http:" && resolvedUrl.protocol !== "https:") {
      return;
    }

    const proxyUrl = new URL("/api/image-proxy", window.location.origin);
    proxyUrl.searchParams.set("url", resolvedUrl.toString());

    const exportUrl =
      resolvedUrl.origin === window.location.origin
        ? resolvedUrl.toString()
        : proxyUrl.toString();

    // Prevent selecting original cross-origin candidates from srcset.
    img.removeAttribute("srcset");
    img.srcset = "";
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";

    if (img.src !== exportUrl) {
      img.src = exportUrl;
      img.setAttribute("src", exportUrl);
    }
  } catch {
    // Ignore malformed URLs and keep original src.
  }
}

function prepareImagesForExport(root: HTMLElement): void {
  const images = root.querySelectorAll("img");
  images.forEach((img) => {
    prepareImageForExport(img as HTMLImageElement);
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result);
      } else {
        reject(new Error("Failed to convert blob to data URL"));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error("FileReader failed"));
    reader.readAsDataURL(blob);
  });
}

async function inlineImagesAsDataUrls(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll("img")) as HTMLImageElement[];

  await Promise.all(
    images.map(async (img) => {
      const src = img.getAttribute("src") || img.src;
      if (!src || src.startsWith("data:") || src.startsWith("blob:")) {
        return;
      }

      try {
        const response = await fetch(src, {
          method: "GET",
          cache: "force-cache",
          credentials: "omit",
        });

        if (!response.ok) {
          return;
        }

        const contentType = response.headers.get("content-type");
        if (contentType && !contentType.startsWith("image/")) {
          return;
        }

        const blob = await response.blob();
        const dataUrl = await blobToDataUrl(blob);

        img.removeAttribute("srcset");
        img.srcset = "";
        img.src = dataUrl;
        img.setAttribute("src", dataUrl);
        img.crossOrigin = "";
      } catch {
        // Keep original URL when fetch/convert fails.
      }
    })
  );
}

async function waitForImagesReady(root: HTMLElement, timeoutMs: number = 8000): Promise<void> {
  const images = Array.from(root.querySelectorAll("img")) as HTMLImageElement[];
  if (images.length === 0) {
    return;
  }

  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }

          const onDone = () => {
            clearTimeout(timer);
            img.removeEventListener("load", onDone);
            img.removeEventListener("error", onDone);
            resolve();
          };

          const timer = window.setTimeout(onDone, timeoutMs);
          img.addEventListener("load", onDone, { once: true });
          img.addEventListener("error", onDone, { once: true });
        })
    )
  );
}

function createIsolatedExportNode(element: HTMLElement): {
  iframe: HTMLIFrameElement;
  exportNode: HTMLElement;
  iframeDoc: Document;
} {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.left = "-10000px";
  iframe.style.top = "0";
  iframe.style.width = `${A4_WIDTH_PX}px`;
  iframe.style.height = `${A4_HEIGHT_PX}px`;
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  iframe.style.border = "0";
  iframe.style.zIndex = "-1";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument;
  if (!iframeDoc) {
    iframe.remove();
    throw new Error("Failed to initialize export iframe");
  }

  iframeDoc.open();
  iframeDoc.write("<!doctype html><html><head><meta charset=\"utf-8\"></head><body></body></html>");
  iframeDoc.close();

  const baseStyle = iframeDoc.createElement("style");
  baseStyle.textContent = `
    html, body {
      margin: 0;
      padding: 0;
      width: ${A4_WIDTH_PX}px;
      height: ${A4_HEIGHT_PX}px;
      background: #ffffff;
      overflow: hidden;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    ${PDF_OVERRIDE_STYLES}
  `;
  iframeDoc.head.appendChild(baseStyle);

  const fontFaceCss = collectFontFaceRules();
  if (fontFaceCss) {
    const fontStyle = iframeDoc.createElement("style");
    fontStyle.textContent = fontFaceCss;
    iframeDoc.head.appendChild(fontStyle);
  }

  const exportNode = element.cloneNode(true) as HTMLElement;
  inlineComputedStyles(element, exportNode);
  exportNode.removeAttribute("id");
  exportNode.setAttribute(PDF_EXPORT_ATTR, "true");
  exportNode.classList.add("pdf-export");
  exportNode.style.width = `${A4_WIDTH_PX}px`;
  exportNode.style.minHeight = `${A4_HEIGHT_PX}px`;
  exportNode.style.height = `${A4_HEIGHT_PX}px`;
  exportNode.style.maxHeight = `${A4_HEIGHT_PX}px`;
  exportNode.style.boxSizing = "border-box";
  exportNode.style.overflow = "hidden";
  exportNode.style.transform = "none";
  exportNode.style.transformOrigin = "top left";
  exportNode.style.margin = "0";
  exportNode.style.backgroundColor = "#ffffff";
  prepareImagesForExport(exportNode);

  iframeDoc.body.appendChild(exportNode);

  return { iframe, exportNode, iframeDoc };
}

async function renderResumeCanvas(
  element: HTMLElement,
  onProgress?: ProgressCallback
): Promise<HTMLCanvasElement> {
  ensureElementCanBeExported(element);

  onProgress?.(30);
  const { iframe, exportNode, iframeDoc } = createIsolatedExportNode(element);

  try {
    await waitForFontsReady(document);
    await waitForFontsReady(iframeDoc);
    await inlineImagesAsDataUrls(exportNode);
    await waitForImagesReady(exportNode);
    onProgress?.(55);

    const canvas = await html2canvas(exportNode, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: "#ffffff",
      // More faithful text/icon layout compared to canvas parser.
      foreignObjectRendering: true,
      imageTimeout: 0,
      removeContainer: true,
      width: A4_WIDTH_PX,
      height: A4_HEIGHT_PX,
      windowWidth: A4_WIDTH_PX,
      windowHeight: A4_HEIGHT_PX,
      scrollX: 0,
      scrollY: 0,
      onclone: () => onProgress?.(60),
    });

    if (!canvas || canvas.width < 10 || canvas.height < 10) {
      throw new Error(`Failed to create canvas: invalid dimensions (${canvas?.width}x${canvas?.height})`);
    }

    return canvas;
  } catch (error) {
    throw new Error(
      `html2canvas failed: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    iframe.remove();
  }
}

function canvasToPngDataUrl(canvas: HTMLCanvasElement): string {
  let imgData: string;
  try {
    imgData = canvas.toDataURL("image/png", 1.0);
  } catch (error) {
    throw new Error(
      `Failed to generate image data from canvas: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  if (!imgData.startsWith("data:image/png;base64,")) {
    throw new Error("Invalid image data format");
  }

  return imgData;
}

function getExportPages(element: HTMLElement): HTMLElement[] {
  if (element.dataset.resumePage === "true") {
    return [element];
  }

  const pageNodes = Array.from(
    element.querySelectorAll<HTMLElement>("[data-resume-page='true']")
  );
  if (pageNodes.length > 0) {
    return pageNodes.slice(0, MAX_PDF_PAGES);
  }

  return [element];
}

async function renderResumeCanvases(
  element: HTMLElement,
  onProgress?: ProgressCallback
): Promise<HTMLCanvasElement[]> {
  const pages = getExportPages(element);
  const canvases: HTMLCanvasElement[] = [];

  for (let index = 0; index < pages.length; index += 1) {
    // 10..85 прогресс на рендеринг страниц
    const startProgress = 10 + Math.round((index / pages.length) * 75);
    onProgress?.(startProgress);

    const canvas = await renderResumeCanvas(pages[index]);
    canvases.push(canvas);

    const endProgress = 10 + Math.round(((index + 1) / pages.length) * 75);
    onProgress?.(endProgress);
  }

  return canvases;
}

function saveCanvasesAsA4PDF(canvases: HTMLCanvasElement[], filename: string): void {
  if (canvases.length === 0) {
    throw new Error("No pages to export");
  }

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  canvases.forEach((canvas, index) => {
    if (index > 0) {
      pdf.addPage("a4", "portrait");
    }
    const imgData = canvasToPngDataUrl(canvas);
    pdf.addImage(imgData, "PNG", 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM, undefined, "FAST");
  });

  const fileName = `${filename}_${new Date().toISOString().split("T")[0]}.pdf`;
  pdf.save(fileName);
}

/**
 * Генерирует PDF из HTML элемента резюме
 *
 * @param element - HTML элемент для конвертации
 * @param filename - Имя файла (без расширения)
 * @returns Promise, который резолвится когда PDF создан
 */
export async function exportResumeToPDF(
  element: HTMLElement,
  filename: string = "resume"
): Promise<void> {
  try {
    const canvases = await renderResumeCanvases(element);
    saveCanvasesAsA4PDF(canvases, filename);
  } catch (error) {
    console.error("PDF export error:", error);
    throw new Error("Failed to export PDF");
  }
}

/**
 * Генерирует превью резюме как изображение
 *
 * @param element - HTML элемент для конвертации
 * @returns Data URL изображения
 */
export async function generateResumePreview(
  element: HTMLElement
): Promise<string> {
  const pages = getExportPages(element);
  const canvas = await renderResumeCanvas(pages[0]);
  return canvasToPngDataUrl(canvas);
}

/**
 * Генерирует уникальное имя файла на основе данных резюме
 *
 * @param firstName - Имя
 * @param lastName - Фамилия
 * @param position - Желаемая должность
 * @returns Имя файла
 */
export function generateResumeFileName(
  firstName?: string,
  lastName?: string,
  position?: string
): string {
  const parts: string[] = [];

  if (lastName) {
    parts.push(lastName.toLowerCase().replace(/\s+/g, "_"));
  }

  if (firstName) {
    parts.push(firstName.toLowerCase().replace(/\s+/g, "_"));
  }

  if (position) {
    parts.push(position.toLowerCase().replace(/\s+/g, "_"));
  }

  const baseName = parts.length > 0 ? parts.join("_") : "resume";

  return baseName;
}

/**
 * Проверяет, поддерживается ли экспорт PDF в браузере
 */
export function isPDFExportSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof document !== "undefined" &&
    !!document.createElement("canvas").getContext("2d")
  );
}

/**
 * Показывает уведомление об экспорте PDF
 */
export function showPDFExportNotification(): void {
  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification("Резюме экспортировано", {
        body: "PDF файл успешно скачан",
        icon: "/favicon.ico",
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification("Резюме экспортировано", {
            body: "PDF файл успешно скачан",
            icon: "/favicon.ico",
          });
        }
      });
    }
  }
}

/**
 * Экспортирует резюме с анимацией загрузки
 *
 * @param element - HTML элемент
 * @param filename - Имя файла
 * @param onProgress - Callback для прогресса (0-100)
 */
export async function exportResumeToPDFWithProgress(
  element: HTMLElement,
  filename: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  onProgress?.(10);

  try {
    const canvases = await renderResumeCanvases(element, onProgress);
    onProgress?.(85);

    saveCanvasesAsA4PDF(canvases, filename);
    onProgress?.(100);

    setTimeout(() => {
      showPDFExportNotification();
    }, 500);
  } catch (error) {
    console.error("PDF export error:", error);
    throw new Error("Failed to export PDF");
  }
}

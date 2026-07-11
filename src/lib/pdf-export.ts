import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { logger } from "@/lib/logger";

interface ExportToPDFOptions {
  filename?: string;
  elementId?: string;
  title?: string;
  orientation?: "portrait" | "landscape";
}

const PAGE_SIZE_MM = {
  portrait: { width: 210, height: 297 },
  landscape: { width: 297, height: 210 },
} as const;

const MARGIN_X_MM = 10;
const TOP_MARGIN_MM = 10;
const BOTTOM_MARGIN_MM = 10;
const BLOCK_GAP_MM = 5;
const DEFAULT_CAPTURE_TIMEOUT_MS = 12000;
const CHART_CAPTURE_TIMEOUT_MS = 18000;

const CSS_COLOR_PROPERTIES = [
  "color",
  "background-color",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "outline-color",
  "text-decoration-color",
  "-webkit-text-stroke-color",
  "caret-color",
  "column-rule-color",
  "fill",
  "stroke",
  "stop-color",
  "flood-color",
  "lighting-color",
] as const;

const CSS_COLOR_VARIABLES = [
  "--color-red-50",
  "--color-red-200",
  "--color-red-500",
  "--color-red-600",
  "--color-red-800",
  "--color-red-950",
  "--color-orange-500",
  "--color-amber-500",
  "--color-yellow-50",
  "--color-yellow-200",
  "--color-yellow-500",
  "--color-yellow-800",
  "--color-yellow-950",
  "--color-emerald-50",
  "--color-emerald-300",
  "--color-emerald-500",
  "--color-emerald-600",
  "--color-emerald-700",
  "--color-emerald-950",
  "--color-sky-300",
  "--color-blue-50",
  "--color-blue-200",
  "--color-blue-500",
  "--color-blue-600",
  "--color-blue-800",
  "--color-blue-950",
  "--color-violet-300",
  "--color-violet-600",
  "--color-purple-500",
  "--color-slate-500",
  "--color-white",
  "--color-black",
] as const;

const UNSUPPORTED_HTML2CANVAS_COLOR_FUNCTION = /\b(?:color-mix|color|oklab|oklch|lab|lch|device-cmyk)\(/i;
const UNSUPPORTED_HTML2CANVAS_VALUE = /\b(?:color-mix|color|oklab|oklch|lab|lch|device-cmyk)\(/i;

function rgbaFromCanvas(context: CanvasRenderingContext2D, value: string): string | null {
  if (!UNSUPPORTED_HTML2CANVAS_COLOR_FUNCTION.test(value)) {
    return null;
  }

  const sentinel = "rgba(1, 2, 3, 0.4)";
  context.clearRect(0, 0, 1, 1);
  context.fillStyle = sentinel;
  context.fillStyle = value;
  if (context.fillStyle === sentinel) {
    return null;
  }

  context.clearRect(0, 0, 1, 1);
  context.fillRect(0, 0, 1, 1);
  const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;
  return `rgba(${red}, ${green}, ${blue}, ${(alpha / 255).toFixed(3)})`;
}

function normalizeUnsupportedCloneColors(clonedDocument: Document, colorContext?: CanvasRenderingContext2D) {
  const view = clonedDocument.defaultView ?? (typeof window !== "undefined" ? window : null);
  if (!colorContext || !view) {
    return;
  }

  const rootStyles = view.getComputedStyle(clonedDocument.documentElement);
  for (const variable of CSS_COLOR_VARIABLES) {
    const rgba = rgbaFromCanvas(colorContext, rootStyles.getPropertyValue(variable));
    if (rgba) {
      clonedDocument.documentElement.style.setProperty(variable, rgba, "important");
    }
  }

  for (const element of clonedDocument.querySelectorAll<HTMLElement>("*")) {
    const styles = view.getComputedStyle(element);
    for (const property of CSS_COLOR_PROPERTIES) {
      const rgba = rgbaFromCanvas(colorContext, styles.getPropertyValue(property));
      if (rgba) {
        element.style.setProperty(property, rgba, "important");
      }
    }

    for (const property of ["box-shadow", "text-shadow", "filter", "backdrop-filter"] as const) {
      const value = styles.getPropertyValue(property);
      if (UNSUPPORTED_HTML2CANVAS_VALUE.test(value)) {
        element.style.setProperty(property, "none", "important");
      }
    }
  }
}

function getVisibleElementHeight(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 ? rect.height : element.offsetHeight;
}

function isVisibleElement(element: HTMLElement) {
  const styles = window.getComputedStyle(element);
  return (
    styles.display !== "none" &&
    styles.visibility !== "hidden" &&
    Number(styles.opacity) !== 0 &&
    getVisibleElementHeight(element) > 0
  );
}

function getExportBlocks(root: HTMLElement) {
  if (root.matches('[data-slot="card"]')) {
    return [root];
  }

  const candidates = Array.from(root.querySelectorAll<HTMLElement>('[data-slot="card"], [data-pdf-block]')).filter(
    isVisibleElement
  );

  const independentBlocks = candidates.filter(
    (candidate) => !candidates.some((other) => other !== candidate && other.contains(candidate))
  );

  if (independentBlocks.length > 0) {
    return independentBlocks;
  }

  const children = Array.from(root.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement && isVisibleElement(child)
  );

  return children.length > 0 ? children : [root];
}

export function preparePdfClone(clonedDocument: Document, colorContext?: CanvasRenderingContext2D) {
  const style = clonedDocument.createElement("style");
  style.textContent = `
    html, body {
      background: #ffffff !important;
      color: #111827 !important;
    }
    * {
      text-shadow: none !important;
      box-shadow: none !important;
      background-image: none !important;
      filter: none !important;
      backdrop-filter: none !important;
      animation: none !important;
      transition: none !important;
      caret-color: transparent !important;
    }
    .dark, .dark * {
      color-scheme: light !important;
    }
    [data-slot="card"], .bg-card, .card {
      background: #ffffff !important;
      color: #111827 !important;
      border-color: #d1d5db !important;
    }
    button, [role="button"], [data-pdf-exclude="true"] {
      display: none !important;
    }
    [data-pdf-expand="true"] {
      overflow: visible !important;
      max-height: none !important;
      height: auto !important;
    }
    [data-pdf-expand="true"] thead {
      position: static !important;
    }
    svg, canvas, img {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
  `;
  clonedDocument.head.appendChild(style);

  clonedDocument.querySelectorAll<HTMLElement>('[data-pdf-expand="true"]').forEach((element) => {
    element.style.setProperty("overflow", "visible", "important");
    element.style.setProperty("max-height", "none", "important");
    element.style.setProperty("height", "auto", "important");
  });

  // Tailwind v4 emits color-mix(in oklab, ...) for alpha utilities, but html2canvas
  // cannot parse that syntax. Resolve only unsupported computed colors in the clone.
  normalizeUnsupportedCloneColors(clonedDocument, colorContext);
}

function hasComplexChart(element: HTMLElement) {
  return Boolean(element.querySelector(".recharts-wrapper, .recharts-surface, canvas, svg"));
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string) {
  let timeoutId: number | undefined;
  const timeout = new Promise<T>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }
  });
}

async function captureElement(
  element: HTMLElement,
  options: { scale?: number; timeoutMs?: number; label?: string } = {}
) {
  const scale = options.scale ?? (hasComplexChart(element) ? 1 : 1.5);
  const timeoutMs =
    options.timeoutMs ?? (hasComplexChart(element) ? CHART_CAPTURE_TIMEOUT_MS : DEFAULT_CAPTURE_TIMEOUT_MS);
  const label = options.label ?? "PDF capture";

  const colorCanvas = document.createElement("canvas");
  const colorContext = colorCanvas.getContext("2d");

  return withTimeout(
    html2canvas(element, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      imageTimeout: 5000,
      removeContainer: true,
      onclone: (clonedDocument) => preparePdfClone(clonedDocument, colorContext ?? undefined),
    }),
    timeoutMs,
    label
  );
}

function createHeaderElement(title: string) {
  const header = document.createElement("div");
  header.style.position = "fixed";
  header.style.left = "-10000px";
  header.style.top = "0";
  header.style.width = "760px";
  header.style.padding = "20px 24px 14px";
  header.style.background = "#ffffff";
  header.style.color = "#111827";
  header.style.fontFamily =
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", "Noto Sans CJK SC", Arial, sans-serif';
  header.innerHTML = `
    <div style="font-size: 22px; line-height: 1.35; font-weight: 700; overflow-wrap: anywhere;"></div>
    <div style="margin-top: 8px; font-size: 12px; color: #6b7280;"></div>
  `;
  header.children[0].textContent = title;
  header.children[1].textContent = `Generated: ${new Date().toLocaleString()}`;
  document.body.appendChild(header);
  return header;
}

async function captureHeader(title: string) {
  const header = createHeaderElement(title);
  try {
    return await captureElement(header, {
      scale: 1.5,
      timeoutMs: DEFAULT_CAPTURE_TIMEOUT_MS,
      label: "PDF header capture",
    });
  } finally {
    header.remove();
  }
}

function drawCanvasSlice(source: HTMLCanvasElement, sourceY: number, sliceHeight: number) {
  const pageCanvas = document.createElement("canvas");
  pageCanvas.width = source.width;
  pageCanvas.height = sliceHeight;
  const context = pageCanvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to create PDF page canvas");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
  context.drawImage(source, 0, sourceY, source.width, sliceHeight, 0, 0, source.width, sliceHeight);

  return pageCanvas;
}

function addCanvasToDocument({
  doc,
  canvas,
  y,
  pageHeight,
  contentWidth,
}: {
  doc: jsPDF;
  canvas: HTMLCanvasElement;
  y: number;
  pageHeight: number;
  contentWidth: number;
}) {
  if (canvas.width <= 0 || canvas.height <= 0) {
    return y;
  }

  const imageHeight = (canvas.height * contentWidth) / canvas.width;
  const maxPageContentHeight = pageHeight - TOP_MARGIN_MM - BOTTOM_MARGIN_MM;
  let cursorY = y;

  if (imageHeight <= maxPageContentHeight) {
    if (cursorY > TOP_MARGIN_MM && cursorY + imageHeight > pageHeight - BOTTOM_MARGIN_MM) {
      doc.addPage();
      cursorY = TOP_MARGIN_MM;
    }

    doc.addImage(canvas.toDataURL("image/png"), "PNG", MARGIN_X_MM, cursorY, contentWidth, imageHeight);
    return cursorY + imageHeight + BLOCK_GAP_MM;
  }

  let sourceY = 0;
  let isFirstSlice = true;
  while (sourceY < canvas.height) {
    const availableHeight = pageHeight - cursorY - BOTTOM_MARGIN_MM;
    const availableHeightForSlice = Math.max(availableHeight, maxPageContentHeight);
    const sliceHeightPx = Math.min(
      canvas.height - sourceY,
      Math.floor((availableHeightForSlice * canvas.width) / contentWidth)
    );

    if (!isFirstSlice || cursorY + (sliceHeightPx * contentWidth) / canvas.width > pageHeight - BOTTOM_MARGIN_MM) {
      doc.addPage();
      cursorY = TOP_MARGIN_MM;
    }

    const pageCanvas = drawCanvasSlice(canvas, sourceY, sliceHeightPx);
    const sliceHeight = (sliceHeightPx * contentWidth) / canvas.width;
    doc.addImage(pageCanvas.toDataURL("image/png"), "PNG", MARGIN_X_MM, cursorY, contentWidth, sliceHeight);
    sourceY += sliceHeightPx;
    cursorY += sliceHeight + BLOCK_GAP_MM;
    isFirstSlice = false;
  }

  return cursorY;
}

export async function exportToPDF({
  filename = "export",
  elementId,
  title = "Financial Calculation Report",
  orientation = "portrait",
}: ExportToPDFOptions): Promise<void> {
  try {
    const doc = new jsPDF({
      orientation,
      unit: "mm",
      format: "a4",
    });
    const { width: pageWidth, height: pageHeight } = PAGE_SIZE_MM[orientation];
    const contentWidth = pageWidth - MARGIN_X_MM * 2;
    let cursorY = TOP_MARGIN_MM;

    const headerCanvas = await captureHeader(title);
    cursorY = addCanvasToDocument({
      doc,
      canvas: headerCanvas,
      y: cursorY,
      pageHeight,
      contentWidth,
    });

    if (elementId) {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Element with id "${elementId}" not found`);
      }

      for (const block of getExportBlocks(element)) {
        const blockCanvas = await captureElement(block, { label: "PDF block capture" });
        cursorY = addCanvasToDocument({
          doc,
          canvas: blockCanvas,
          y: cursorY,
          pageHeight,
          contentWidth,
        });
      }
    }

    doc.save(`${filename}.pdf`);
  } catch (error) {
    logger.error("PDF export error:", error);
    throw error;
  }
}

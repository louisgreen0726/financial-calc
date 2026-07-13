interface PrintReportOptions {
  elementId: string;
  title: string;
  filename?: string;
  generatedLabel?: string;
  onPrintModeChange?: (isPrinting: boolean) => void;
}

const PRINT_MODE_ATTRIBUTE = "data-print-mode";
const PRINT_TARGET_ATTRIBUTE = "data-print-target";
const PRINT_HIDDEN_ATTRIBUTE = "data-print-hidden-by-export";
const PRINT_HEADER_ATTRIBUTE = "data-print-report-header";
const PRINT_CHART_ATTRIBUTE = "data-print-chart";
const PRINT_CHART_WIDTH = "--print-chart-width";
const PRINT_CHART_HEIGHT = "--print-chart-height";
const PRINT_CLEANUP_DELAY_MS = 1000;

let activePrintCleanup: (() => void) | null = null;

function normalizeDocumentTitle(filename: string | undefined, fallback: string) {
  const normalized = filename?.replace(/\.pdf$/i, "").trim();
  return normalized || fallback;
}

function createPrintHeader(title: string, generatedLabel: string | undefined) {
  const header = document.createElement("header");
  header.setAttribute(PRINT_HEADER_ATTRIBUTE, "true");

  const heading = document.createElement("h1");
  heading.textContent = title;
  header.appendChild(heading);

  const generatedAt = document.createElement("p");
  const timestamp = new Date().toLocaleString(document.documentElement.lang || undefined);
  generatedAt.textContent = generatedLabel ? `${generatedLabel}: ${timestamp}` : timestamp;
  header.appendChild(generatedAt);

  return header;
}

function getElementsOutsideTarget(target: HTMLElement) {
  const elements: HTMLElement[] = [];
  let current: HTMLElement | null = target;

  while (current.parentElement) {
    for (const sibling of current.parentElement.children) {
      if (sibling !== current && sibling instanceof HTMLElement) {
        elements.push(sibling);
      }
    }

    current = current.parentElement;
    if (current === document.body) {
      break;
    }
  }

  return elements;
}

function getChartDimensions(target: HTMLElement) {
  return Array.from(target.querySelectorAll<HTMLElement>(".recharts-wrapper"))
    .map((chart) => ({ chart, rect: chart.getBoundingClientRect() }))
    .filter(({ rect }) => rect.width > 0 && rect.height > 0);
}

function freezeChartDimensions(charts: ReturnType<typeof getChartDimensions>) {
  charts.forEach(({ chart, rect }) => {
    chart.setAttribute(PRINT_CHART_ATTRIBUTE, "true");
    chart.style.setProperty(PRINT_CHART_WIDTH, `${rect.width}px`);
    chart.style.setProperty(PRINT_CHART_HEIGHT, `${rect.height}px`);
  });
}

function restoreChartDimensions(charts: ReturnType<typeof getChartDimensions>) {
  charts.forEach(({ chart }) => {
    chart.removeAttribute(PRINT_CHART_ATTRIBUTE);
    chart.style.removeProperty(PRINT_CHART_WIDTH);
    chart.style.removeProperty(PRINT_CHART_HEIGHT);
  });
}

export function prepareReportForPrint({ elementId, title, filename, generatedLabel }: PrintReportOptions): () => void {
  activePrintCleanup?.();

  const target = document.getElementById(elementId);
  if (!target) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  const originalTitle = document.title;
  const hiddenElements = getElementsOutsideTarget(target);
  const charts = getChartDimensions(target);
  const header = createPrintHeader(title, generatedLabel);
  let cleanedUp = false;

  const cleanup = () => {
    if (cleanedUp) {
      return;
    }

    cleanedUp = true;
    header.remove();
    target.removeAttribute(PRINT_TARGET_ATTRIBUTE);
    restoreChartDimensions(charts);
    hiddenElements.forEach((element) => element.removeAttribute(PRINT_HIDDEN_ATTRIBUTE));
    document.body.removeAttribute(PRINT_MODE_ATTRIBUTE);
    document.title = originalTitle;
    if (activePrintCleanup === cleanup) {
      activePrintCleanup = null;
    }
  };

  try {
    hiddenElements.forEach((element) => element.setAttribute(PRINT_HIDDEN_ATTRIBUTE, "true"));
    freezeChartDimensions(charts);
    target.prepend(header);
    target.setAttribute(PRINT_TARGET_ATTRIBUTE, "true");
    document.body.setAttribute(PRINT_MODE_ATTRIBUTE, "report");
    document.title = normalizeDocumentTitle(filename, title);
    activePrintCleanup = cleanup;
    return cleanup;
  } catch (error) {
    cleanup();
    throw error;
  }
}

async function waitForPrintLayout() {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

export async function printReport(options: PrintReportOptions): Promise<void> {
  let cleanup: (() => void) | null = null;
  let restored = false;
  const restore = () => {
    if (restored) return;
    restored = true;
    cleanup?.();
    void options.onPrintModeChange?.(false);
  };
  const handleAfterPrint = () => {
    window.removeEventListener("afterprint", handleAfterPrint);
    restore();
  };

  try {
    await options.onPrintModeChange?.(true);
    await waitForPrintLayout();
    cleanup = prepareReportForPrint(options);
    window.addEventListener("afterprint", handleAfterPrint, { once: true });
    await waitForPrintLayout();
    window.print();
    window.setTimeout(handleAfterPrint, PRINT_CLEANUP_DELAY_MS);
  } catch (error) {
    handleAfterPrint();
    throw error;
  }
}

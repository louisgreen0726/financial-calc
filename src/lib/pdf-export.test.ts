import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("html2canvas", () => ({ default: vi.fn() }));
vi.mock("jspdf", () => ({ default: vi.fn() }));

import { addCanvasToDocument, preparePdfClone } from "@/lib/pdf-export";

describe("PDF clone preparation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("expands only explicitly marked report containers", () => {
    const clonedDocument = document.implementation.createHTMLDocument("PDF clone");
    clonedDocument.body.innerHTML = `
      <section data-pdf-expand="true" style="overflow: hidden; max-height: 400px; height: 400px">
        <div data-pdf-expand="true" style="overflow: auto; max-height: 250px; height: 250px">
          <table><thead style="position: sticky"><tr><th>Period</th></tr></thead></table>
        </div>
      </section>
      <div id="chart" class="recharts-wrapper" style="overflow: hidden; max-height: 320px; height: 320px"></div>
    `;

    preparePdfClone(clonedDocument);

    const expandedElements = clonedDocument.querySelectorAll<HTMLElement>('[data-pdf-expand="true"]');
    expect(expandedElements).toHaveLength(2);
    expandedElements.forEach((element) => {
      expect(element.style.getPropertyValue("overflow")).toBe("visible");
      expect(element.style.getPropertyPriority("overflow")).toBe("important");
      expect(element.style.getPropertyValue("max-height")).toBe("none");
      expect(element.style.getPropertyPriority("max-height")).toBe("important");
      expect(element.style.getPropertyValue("height")).toBe("auto");
      expect(element.style.getPropertyPriority("height")).toBe("important");
    });

    const chart = clonedDocument.getElementById("chart") as HTMLElement;
    expect(chart.style.overflow).toBe("hidden");
    expect(chart.style.maxHeight).toBe("320px");
    expect(chart.style.height).toBe("320px");

    expect(clonedDocument.head.querySelector("style")?.textContent).toContain('[data-pdf-expand="true"]');
  });

  it("bakes unsupported computed color functions into rgba styles", () => {
    const clonedDocument = document.implementation.createHTMLDocument("PDF clone");
    clonedDocument.body.innerHTML = '<div id="report">Report</div>';
    const report = clonedDocument.getElementById("report") as HTMLElement;

    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      display: "block",
      getPropertyValue: (property: string) => {
        if (property === "color") return "color-mix(in oklab, red 50%, blue)";
        if (property === "--color-blue-500") return "oklch(62.3% .214 259.815)";
        return "";
      },
    } as CSSStyleDeclaration);
    const colorContext = {
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      getImageData: vi.fn(() => ({ data: new Uint8ClampedArray([12, 34, 56, 128]) })),
      fillStyle: "rgba(1, 2, 3, 0.4)",
    } as unknown as CanvasRenderingContext2D;

    preparePdfClone(clonedDocument, colorContext);

    expect(report.style.getPropertyValue("color")).toBe("rgba(12, 34, 56, 0.502)");
    expect(clonedDocument.documentElement.style.getPropertyValue("--color-blue-500")).toBe("rgba(12, 34, 56, 0.502)");
  });

  it("uses the current page remainder for the first slice and compresses raster output", () => {
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      fillStyle: "#ffffff",
      fillRect: vi.fn(),
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    const toDataUrl = vi
      .spyOn(HTMLCanvasElement.prototype, "toDataURL")
      .mockReturnValue("data:image/jpeg;base64,compressed");
    const source = document.createElement("canvas");
    source.width = 1000;
    source.height = 2000;
    const addPage = vi.fn();
    const addImage = vi.fn();
    const doc = {
      addPage,
      addImage,
    } as unknown as Parameters<typeof addCanvasToDocument>[0]["doc"];

    addCanvasToDocument({
      doc,
      canvas: source,
      y: 35,
      pageHeight: 297,
      contentWidth: 190,
    });

    expect(addImage.mock.calls[0].slice(0, 5)).toEqual(["data:image/jpeg;base64,compressed", "JPEG", 10, 35, 190]);
    expect(addImage.mock.calls[0][5]).toBeCloseTo(251.94, 5);
    expect(addImage.mock.invocationCallOrder[0]).toBeLessThan(addPage.mock.invocationCallOrder[0]);
    expect(toDataUrl).toHaveBeenCalledWith("image/jpeg", 0.9);
    expect(getContext).toHaveBeenCalled();
  });
});

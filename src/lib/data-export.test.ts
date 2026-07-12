import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createReportExportEnvelope,
  createReportCsvRows,
  downloadTextFile,
  escapeCsvCell,
  normalizeExportFilename,
  serializeCsv,
  serializeJson,
} from "@/lib/data-export";

describe("structured data export", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("escapes CSV syntax and prefixes formula-like user strings", () => {
    const csv = serializeCsv(
      [
        {
          name: '=IMPORTXML("https://example.com")',
          note: "line one\nline two",
          numericLoss: -10,
          stringLoss: "-10",
        },
      ],
      ["name", "note", "numericLoss", "stringLoss"]
    );

    expect(csv).toBe(
      'name,note,numericLoss,stringLoss\r\n"\'=IMPORTXML(""https://example.com"")","line one\nline two",-10,\'-10'
    );
    expect(escapeCsvCell("+SUM(A1:A2)")).toBe("'+SUM(A1:A2)");
    expect(escapeCsvCell('@HYPERLINK("https://example.com")')).toBe('"\'@HYPERLINK(""https://example.com"")"');
    expect(escapeCsvCell("\u000b=CMD()")).toBe("'\u000b=CMD()");
  });

  it("preserves columns introduced by later rows and serializes nested values", () => {
    expect(
      serializeCsv([
        { period: 1, allocation: { equity: 0.6, bonds: 0.4 } },
        { period: 2, note: "mature" },
      ])
    ).toBe('period,allocation,note\r\n1,"{""equity"":0.6,""bonds"":0.4}",\r\n2,,mature');
  });

  it("creates self-describing CSV rows and a versioned JSON envelope", () => {
    const source = {
      title: "Loan analysis",
      inputs: { amount: "500000", years: "30" },
      results: { payment: 2533.43 },
      data: [{ period: 1, balance: 499341.57 }],
      tabularData: [{ period: 1, balance: 499341.57 }],
    };
    const exportedAt = "2026-07-13T01:00:00.000Z";

    expect(createReportExportEnvelope(source, exportedAt)).toEqual({
      schemaVersion: 1,
      exportedAt,
      report: {
        title: "Loan analysis",
        inputs: { amount: "500000", years: "30" },
        results: { payment: 2533.43 },
      },
      data: [{ period: 1, balance: 499341.57 }],
    });
    expect(createReportCsvRows(source, exportedAt)).toEqual([
      {
        "report.schemaVersion": 1,
        "report.exportedAt": exportedAt,
        "report.title": "Loan analysis",
        "input.amount": "500000",
        "input.years": "30",
        "result.payment": 2533.43,
        "data.period": 1,
        "data.balance": 499341.57,
      },
    ]);
  });

  it("rejects misleading JSON values and preserves bigint explicitly", () => {
    expect(() => serializeJson(undefined)).toThrow("undefined");
    expect(() => serializeJson({ result: Number.POSITIVE_INFINITY })).toThrow("non-finite");
    expect(serializeJson({ periods: BigInt(360) })).toContain('"periods": "360"');
  });

  it("normalizes unsafe and reserved filenames", () => {
    expect(normalizeExportFilename(" loan:summary/30?.CSV ", "csv")).toBe("loan-summary-30-.csv");
    expect(normalizeExportFilename("CON", ".json")).toBe("_CON.json");
    expect(normalizeExportFilename("...", "json")).toBe("export.json");
    expect(normalizeExportFilename("a".repeat(119) + ".truncated", "csv")).toBe("a".repeat(119) + ".csv");
  });

  it("removes the temporary link and revokes its URL after the click completes", () => {
    vi.useFakeTimers();
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:export");
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    const filename = downloadTextFile({
      content: "value\r\n42",
      filename: "report",
      extension: "csv",
      mimeType: "text/csv;charset=utf-8",
    });

    expect(filename).toBe("report.csv");
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(document.querySelector('a[download="report.csv"]')).toBeNull();
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:export");
  });
});

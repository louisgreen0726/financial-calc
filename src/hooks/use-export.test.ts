import { describe, expect, it } from "vitest";

import { escapeCsvCell, serializeCsv } from "@/hooks/use-export";

describe("CSV export helpers", () => {
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
      'name,note,numericLoss,stringLoss\n"\'=IMPORTXML(""https://example.com"")","line one\nline two",-10,\'-10'
    );
  });

  it("prefixes strings that spreadsheet apps commonly treat as formulas", () => {
    expect(escapeCsvCell("+SUM(A1:A2)")).toBe("'+SUM(A1:A2)");
    expect(escapeCsvCell('@HYPERLINK("https://example.com")')).toBe('"\'@HYPERLINK(""https://example.com"")"');
    expect(escapeCsvCell(" normal text")).toBe("' normal text");
  });
});

import { describe, expect, it } from "vitest";
import {
  createCalculationHistoryEnvelope,
  parseStoredCalculationHistory,
  type CalculationHistoryItem,
} from "@/lib/calculation-history";
import { HISTORY_EXPIRY_DAYS } from "@/lib/constants";

const NOW = 1_800_000_000_000;

function makeItem(overrides: Partial<CalculationHistoryItem> = {}): CalculationHistoryItem {
  return {
    id: "history-1",
    page: "tvm",
    inputs: { rate: "5", periods: 10 },
    result: 1250,
    timestamp: NOW - 1000,
    resultFormat: "currency",
    ...overrides,
  };
}

describe("calculation history storage schema", () => {
  it("migrates legacy arrays into the versioned envelope", () => {
    const parsed = parseStoredCalculationHistory([makeItem()], NOW);

    expect(parsed.items).toEqual([makeItem()]);
    expect(parsed.needsWriteBack).toBe(true);
    expect(createCalculationHistoryEnvelope(parsed.items)).toEqual({ version: 1, items: [makeItem()] });
  });

  it("keeps a valid current envelope without rewriting it", () => {
    const parsed = parseStoredCalculationHistory(createCalculationHistoryEnvelope([makeItem()]), NOW);

    expect(parsed.items).toEqual([makeItem()]);
    expect(parsed.needsWriteBack).toBe(false);
    expect(parsed.unsupportedVersion).toBe(false);
  });

  it.each([-1, 0, 2])("preserves unknown schema version %s instead of downgrading it", (version) => {
    const parsed = parseStoredCalculationHistory({ version, items: [makeItem()] }, NOW);

    expect(parsed).toEqual({ items: [], needsWriteBack: false, unsupportedVersion: true });
  });

  it("drops malformed, unknown, expired, future, and non-finite records", () => {
    const expiredAt = NOW - HISTORY_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    const source = createCalculationHistoryEnvelope([
      makeItem(),
      makeItem({ id: "expired", timestamp: expiredAt }),
      makeItem({ id: "future", timestamp: NOW + 6 * 60 * 1000 }),
      makeItem({ id: "bad-result", result: Number.POSITIVE_INFINITY }),
      { ...makeItem({ id: "bad-page" }), page: "settings" } as unknown as CalculationHistoryItem,
      { ...makeItem({ id: "bad-inputs" }), inputs: null } as unknown as CalculationHistoryItem,
    ]);

    const parsed = parseStoredCalculationHistory(source, NOW);

    expect(parsed.items).toEqual([makeItem()]);
    expect(parsed.needsWriteBack).toBe(true);
  });

  it("keeps the newest valid record when ids are duplicated", () => {
    const newest = makeItem({ timestamp: NOW - 500, result: 1500 });
    const parsed = parseStoredCalculationHistory(
      createCalculationHistoryEnvelope([makeItem(), newest, makeItem({ id: "other", timestamp: NOW - 750 })]),
      NOW
    );

    expect(parsed.items).toEqual([newest, makeItem({ id: "other", timestamp: NOW - 750 })]);
    expect(parsed.needsWriteBack).toBe(true);
  });

  it("preserves special input keys as own data properties", () => {
    const inputs = JSON.parse('{"__proto__":"kept","constructor":"also-kept"}') as Record<string, string>;
    const parsed = parseStoredCalculationHistory(createCalculationHistoryEnvelope([makeItem({ inputs })]), NOW);
    const parsedInputs = parsed.items[0].inputs;

    expect(Object.prototype.hasOwnProperty.call(parsedInputs, "__proto__")).toBe(true);
    expect(parsedInputs).toEqual(inputs);
    expect(Object.getPrototypeOf(parsedInputs)).toBe(Object.prototype);
  });

  it("applies the storage cap per calculator page", () => {
    const tvmItems = Array.from({ length: 51 }, (_, index) =>
      makeItem({ id: `tvm-${index}`, timestamp: NOW - index - 1 })
    );
    const riskItem = makeItem({ id: "risk-1", page: "risk", timestamp: NOW - 100 });
    const parsed = parseStoredCalculationHistory(createCalculationHistoryEnvelope([...tvmItems, riskItem]), NOW);

    expect(parsed.items.filter((item) => item.page === "tvm")).toHaveLength(50);
    expect(parsed.items).toContainEqual(riskItem);
    expect(parsed.items).toHaveLength(51);
    expect(parsed.needsWriteBack).toBe(true);
  });
});

import { parseCashFlowHistory, serializeCashFlowHistory } from "@/lib/cash-flow-history";
import { MAX_CASH_FLOWS } from "@/lib/constants";
import { parseOptionalNumber } from "@/lib/input-utils";

function parseLegacyReference(serializedFlows: string): string[] {
  const parts = serializedFlows.split(",");
  const memo = new Map<number, string[] | null>();
  const isStrictNumber = (value: string) => {
    const normalized = value.trim().replace(/[\s_]/g, "");
    return (
      /^[+-]?(?:(?:\d{1,3}(?:,\d{3})+)|\d+)(?:\.\d*)?(?:e[+-]?\d+)?$/i.test(normalized) &&
      parseOptionalNumber(value) !== null
    );
  };

  const parseFrom = (start: number): string[] | null => {
    if (start === parts.length) return [];
    if (memo.has(start)) return memo.get(start) ?? null;

    let best: string[] | null = null;
    for (let end = start + 1; end <= parts.length; end += 1) {
      const candidate = parts.slice(start, end).join(",").trim();
      if (!isStrictNumber(candidate)) continue;
      const remaining = parseFrom(end);
      if (!remaining) continue;
      const next = [candidate, ...remaining];
      if (!best || next.length < best.length) best = next;
    }
    memo.set(start, best);
    return best;
  };

  return parseFrom(0) ?? [];
}

describe("cash-flow history serialization", () => {
  it("round-trips individual cash-flow inputs through JSON", () => {
    const flows = ["-10,000", "3,000", "4000.50"];
    expect(parseCashFlowHistory(serializeCashFlowHistory(flows))).toEqual(flows);
  });

  it("reads old comma-separated records without splitting grouped thousands", () => {
    expect(parseCashFlowHistory("-10,000,3,000,4000.50")).toEqual(["-10,000", "3,000", "4000.50"]);
    expect(parseCashFlowHistory("-10000,3000,4000")).toEqual(["-10000", "3000", "4000"]);
    expect(parseCashFlowHistory("1,000,200,000,-2,500,3.5")).toEqual(["1,000,200,000", "-2,500", "3.5"]);
    expect(parseCashFlowHistory("1, 000")).toEqual(["1", "000"]);
  });

  it("matches the legacy minimum-token contract across deterministic small records", () => {
    const segments = ["1", "000", "250", "-2", "3.5", "1e2", " 000", "000 ", "bad"];
    let state = 0x9e3779b9;
    const random = () => {
      state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
      return state / 0x1_0000_0000;
    };

    for (let iteration = 0; iteration < 500; iteration += 1) {
      const length = 1 + Math.floor(random() * 7);
      const serialized = Array.from({ length }, () => segments[Math.floor(random() * segments.length)]).join(",");
      expect(parseCashFlowHistory(serialized), serialized).toEqual(parseLegacyReference(serialized));
    }
  });

  it("rejects invalid JSON records and malformed legacy text", () => {
    expect(parseCashFlowHistory('["1000",{}]')).toEqual([]);
    expect(parseCashFlowHistory("not-a-number, 1000, nope")).toEqual([]);
  });

  it("keeps the complete 120-flow boundary for current and legacy records", () => {
    const flows = Array.from({ length: MAX_CASH_FLOWS }, (_, index) => `${index + 1}.0`);

    expect(parseCashFlowHistory(serializeCashFlowHistory(flows))).toEqual(flows);
    expect(parseCashFlowHistory(flows.join(","))).toEqual(flows);
  });

  it("validates complete records and truncates valid current and legacy records to 120 flows", () => {
    const flows = Array.from({ length: MAX_CASH_FLOWS + 1 }, (_, index) => `${index + 1}.0`);

    expect(parseCashFlowHistory(serializeCashFlowHistory(flows))).toEqual(flows.slice(0, MAX_CASH_FLOWS));
    expect(parseCashFlowHistory(flows.join(","))).toEqual(flows.slice(0, MAX_CASH_FLOWS));
    expect(parseCashFlowHistory(JSON.stringify([...flows.slice(0, MAX_CASH_FLOWS), {}]))).toEqual([]);
    expect(parseCashFlowHistory(`${flows.slice(0, MAX_CASH_FLOWS).join(",")},broken`)).toEqual([]);
  });

  it("rejects a roughly 20k malformed legacy record without recursive partitioning", () => {
    const malformed = `${"1,".repeat(9_995)}broken`;

    expect(malformed.length).toBeLessThanOrEqual(20_000);
    expect(parseCashFlowHistory(malformed)).toEqual([]);
  });
});

import { parseCashFlowHistory, serializeCashFlowHistory } from "@/lib/cash-flow-history";

describe("cash-flow history serialization", () => {
  it("round-trips individual cash-flow inputs through JSON", () => {
    const flows = ["-10,000", "3,000", "4000.50"];
    expect(parseCashFlowHistory(serializeCashFlowHistory(flows))).toEqual(flows);
  });

  it("reads old comma-separated records without splitting grouped thousands", () => {
    expect(parseCashFlowHistory("-10,000,3,000,4000.50")).toEqual(["-10,000", "3,000", "4000.50"]);
    expect(parseCashFlowHistory("-10000,3000,4000")).toEqual(["-10000", "3000", "4000"]);
  });

  it("rejects invalid JSON records and malformed legacy text", () => {
    expect(parseCashFlowHistory('["1000",{}]')).toEqual([]);
    expect(parseCashFlowHistory("not-a-number, 1000, nope")).toEqual([]);
  });
});

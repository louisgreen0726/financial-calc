import {
  buildOptionPayoffData,
  buildRiskDistributionData,
  getOptionPayoffDomain,
  getRiskTailGradientOffset,
} from "@/lib/chart-data";

describe("calculator chart data", () => {
  it("sorts risk losses on an ascending numeric axis with the loss tail on the right", () => {
    const zScore = 2.326;
    const data = buildRiskDistributionData(0.03, 100_000, zScore);

    expect(data.length).toBeGreaterThan(0);
    expect(data.every((point, index) => index === 0 || data[index - 1].loss <= point.loss)).toBe(true);
    expect(data[0].isTail).toBe(false);
    expect(data.at(-1)?.isTail).toBe(true);
    expect(getRiskTailGradientOffset(zScore)).toBeGreaterThan(50);

    const valueAtRisk = zScore * 0.03 * 100_000;
    expect(data[0].loss).toBeLessThan(valueAtRisk);
    expect(data.at(-1)?.loss).toBeGreaterThan(valueAtRisk);
  });

  it("keeps extreme strikes inside the option payoff domain and sampling", () => {
    const spot = 100;
    const strike = 1_000;
    const domain = getOptionPayoffDomain(spot, strike);
    const data = buildOptionPayoffData(spot, strike);

    expect(domain[0]).toBeLessThan(strike);
    expect(domain[1]).toBeGreaterThan(strike);
    expect(data.some((point) => point.spot === strike)).toBe(true);
    expect(data.every((point, index) => index === 0 || data[index - 1].spot <= point.spot)).toBe(true);
    expect(data.find((point) => point.spot === strike)).toMatchObject({ intrinsicCall: 0, intrinsicPut: 0 });
  });

  it("rejects invalid chart inputs", () => {
    expect(buildRiskDistributionData(Number.NaN, 100, 1.645)).toEqual([]);
    expect(buildOptionPayoffData(0, 100)).toEqual([]);
  });
});

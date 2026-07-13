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

    expect(domain).toEqual([2.5, 1_047.5]);
    expect(data).toHaveLength(43);
    expect(domain[0]).toBeLessThan(strike);
    expect(domain[1]).toBeGreaterThan(strike);
    expect(data.some((point) => point.spot === strike)).toBe(true);
    expect(data.every((point, index) => index === 0 || data[index - 1].spot <= point.spot)).toBe(true);
    expect(data.find((point) => point.spot === strike)).toMatchObject({ intrinsicCall: 0, intrinsicPut: 0 });
  });

  it("keeps extreme finite option inputs finite and monotonic", () => {
    const cases = [
      [Number.MAX_VALUE, 1],
      [1, Number.MAX_VALUE],
      [Number.MAX_VALUE, Number.MAX_VALUE],
    ] as const;

    for (const [spot, strike] of cases) {
      const domain = getOptionPayoffDomain(spot, strike);
      const data = buildOptionPayoffData(spot, strike);

      expect(domain.every(Number.isFinite)).toBe(true);
      expect(domain[0]).toBeGreaterThanOrEqual(0);
      expect(domain[0]).toBeLessThanOrEqual(Math.min(spot, strike));
      expect(domain[1]).toBeGreaterThanOrEqual(Math.max(spot, strike));
      expect(data.length).toBeGreaterThanOrEqual(41);
      expect(data.some((point) => point.spot === spot)).toBe(true);
      expect(data.some((point) => point.spot === strike)).toBe(true);
      expect(data.every((point) => Object.values(point).every(Number.isFinite))).toBe(true);
      expect(
        data.every(
          (point, index) =>
            index === 0 ||
            (data[index - 1].spot <= point.spot &&
              data[index - 1].intrinsicCall <= point.intrinsicCall &&
              data[index - 1].intrinsicPut >= point.intrinsicPut)
        )
      ).toBe(true);
    }
  });

  it("rejects invalid chart inputs", () => {
    expect(buildRiskDistributionData(Number.NaN, 100, 1.645)).toEqual([]);
    expect(buildOptionPayoffData(0, 100)).toEqual([]);
  });
});

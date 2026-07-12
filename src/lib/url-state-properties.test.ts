import { buildShareableUrl, readShareableState } from "@/hooks/use-shareable-url";
import {
  MAX_URL_STATE_ARRAY_ITEMS,
  MAX_URL_STATE_VALUE_LENGTH,
  parseUrlArrayValue,
  serializeUrlValue,
  type UrlStateValue,
} from "@/lib/url-state-utils";

function createSeededRandom(seed = 0x9e3779b9) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

describe("URL state property matrix", () => {
  it("round-trips representative state for every calculator route", () => {
    const contracts: Array<[string, string, Record<string, UrlStateValue>]> = [
      ["/tvm", "fc", { target: "rate", rate: "5", nper: "10", pmt: "-100", pv: "1000", fv: "0" }],
      ["/cash-flow", "cash", { rate: "8.5", flows: ["-1000", "500|pipe", "700"] }],
      ["/equity", "equity", { capmRf: "3", capmBeta: "1.2", capmRm: "9", ddmGrowth: "2" }],
      ["/portfolio", "portfolio", { rf: 3, correlation: -0.2, seed: "audit-seed", assets: '[{"name":"A"}]' }],
      ["/bonds", "bonds", { faceValue: "1000", couponRate: "5", years: "10", ytm: "4", frequency: "2" }],
      [
        "/options",
        "options",
        { spot: "100", strike: "95", time: "1", rate: "5", dividendYield: "2", volatility: "20" },
      ],
      ["/risk", "risk", { value: "100000", volatility: "15", confidence: "0.99", days: "10" }],
      ["/loans", "loans", { method: "CAM", amount: "250000", rate: "4.25", years: "30" }],
      ["/macro", "macro", { calculator: "realRate", nominalRate: "5", realInfRate: "2" }],
    ];

    for (const [pathname, prefix, state] of contracts) {
      const url = new URL(buildShareableUrl(pathname, prefix, state));
      expect(url.pathname).toBe(pathname);
      expect(readShareableState(url.search, prefix, state)).toEqual(state);
      expect(url.toString().length).toBeLessThanOrEqual(MAX_URL_STATE_VALUE_LENGTH);
    }
  });

  it("round-trips 500 deterministic JSON string arrays without delimiter ambiguity", () => {
    const random = createSeededRandom();
    const alphabet = ["a", "Z", "0", "|", '"', "\\", " ", "&", "=", "%", "[", "]"];

    for (let iteration = 0; iteration < 500; iteration += 1) {
      const itemCount = Math.floor(random() * 20);
      const values = Array.from({ length: itemCount }, () => {
        const length = Math.floor(random() * 30);
        return Array.from({ length }, () => alphabet[Math.floor(random() * alphabet.length)]).join("");
      });
      expect(parseUrlArrayValue(serializeUrlValue(values))).toEqual(values);
    }
  });

  it("bounds hostile arrays and ignores oversized scalar parameters before parsing", () => {
    const oversizedArray = Array.from({ length: MAX_URL_STATE_ARRAY_ITEMS + 50 }, (_, index) => String(index));
    expect(parseUrlArrayValue(serializeUrlValue(oversizedArray))).toEqual(
      oversizedArray.slice(0, MAX_URL_STATE_ARRAY_ITEMS)
    );
    expect(parseUrlArrayValue("x".repeat(MAX_URL_STATE_VALUE_LENGTH + 1))).toEqual([]);

    const restored = readShareableState(
      `?risk_value=${"9".repeat(MAX_URL_STATE_VALUE_LENGTH + 1)}&risk_days=10`,
      "risk",
      { value: "100000", days: "1" }
    );
    expect(restored).toEqual({ days: "10" });
  });

  it("rejects malformed/non-string JSON arrays and safely preserves special own keys", () => {
    for (const malformed of ["json:{", "json:{}", "json:[1,2]", 'json:["ok",null]', "json:null"]) {
      expect(parseUrlArrayValue(malformed)).toEqual([]);
    }

    const defaults = JSON.parse('{"__proto__":"default","constructor":"default"}') as Record<string, string>;
    const restored = readShareableState("?special___proto__=kept&special_constructor=also-kept", "special", defaults);
    expect(Object.getPrototypeOf(restored)).toBe(Object.prototype);
    expect(Object.prototype.hasOwnProperty.call(restored, "__proto__")).toBe(true);
    expect(restored).toEqual(JSON.parse('{"__proto__":"kept","constructor":"also-kept"}'));
  });
});

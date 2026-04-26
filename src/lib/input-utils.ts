export function parseOptionalNumber(value: string): number | null {
  const normalized = value.trim().replace(/[,\s_]/g, "");

  if (normalized === "") {
    return null;
  }

  const numericPattern = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
  if (!numericPattern.test(normalized)) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseRequiredNumber(value: string, fallback = 0): number {
  const parsed = parseOptionalNumber(value);
  return parsed ?? fallback;
}

export function parseNumberArray(values: string[]): { parsed: number[]; hasInvalid: boolean } {
  let hasInvalid = false;
  const parsed = values.map((value) => {
    const next = parseOptionalNumber(value);
    if (next === null) {
      hasInvalid = true;
      return 0;
    }
    return next;
  });

  return { parsed, hasInvalid };
}

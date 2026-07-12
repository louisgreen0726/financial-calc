const GROUPED_INTEGER_PATTERN = String.raw`(?:\d{1,3}(?:,\d{3})+|\d{1,3}(?: \d{3})+|\d{1,3}(?:_\d{3})+|\d{1,3}(?:[\u00a0\u202f]\d{3})+|\d+)`;
const NUMERIC_INPUT_PATTERN = new RegExp(
  String.raw`^[+-]?(?:(?:${GROUPED_INTEGER_PATTERN})(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$`,
  "i"
);

export function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();

  if (trimmed === "") {
    return null;
  }

  // Separators are accepted only as consistent three-digit groups. Silently
  // removing arbitrary punctuation can turn a typo such as "1,2,3" into 123.
  if (!NUMERIC_INPUT_PATTERN.test(trimmed)) {
    return null;
  }

  const normalized = trimmed.replace(/[, _\u00a0\u202f]/g, "");
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

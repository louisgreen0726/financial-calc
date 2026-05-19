export const TVM_TARGETS = ["pv", "fv", "pmt", "nper", "rate"] as const;
export type TVMTarget = (typeof TVM_TARGETS)[number];

export const LOAN_METHODS = ["CPM", "CAM"] as const;
export type LoanMethodState = (typeof LOAN_METHODS)[number];

export const MACRO_TABS = ["inflation", "purchasingPower", "realRate", "cpiAdjust", "ppp"] as const;
export type MacroTab = (typeof MACRO_TABS)[number];

function isOneOf<T extends readonly string[]>(values: T, value: unknown): value is T[number] {
  return typeof value === "string" && values.includes(value);
}

export function normalizeTVMTarget(value: unknown, fallback: TVMTarget = "fv"): TVMTarget {
  return isOneOf(TVM_TARGETS, value) ? value : fallback;
}

export function normalizeLoanMethod(value: unknown, fallback: LoanMethodState = "CPM"): LoanMethodState {
  return isOneOf(LOAN_METHODS, value) ? value : fallback;
}

export function normalizeMacroTab(value: unknown, fallback: MacroTab = "inflation"): MacroTab {
  return isOneOf(MACRO_TABS, value) ? value : fallback;
}

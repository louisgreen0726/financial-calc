import type { CalculationHistoryItem, HistoryResultFormat } from "@/hooks/use-calculation-history";
import { formatCurrency, formatNumber } from "@/lib/utils";

export interface HistoryFormatOptions {
  locale?: string;
  notAvailable?: string;
  periodsUnit?: string;
  yearsUnit?: string;
}

function inferHistoryFormatFromInputs(item: CalculationHistoryItem): HistoryResultFormat | null {
  if (item.page === "tvm" && typeof item.inputs.target === "string") {
    switch (item.inputs.target) {
      case "rate":
        return "percentDecimal";
      case "nper":
        return "periods";
      case "pv":
      case "fv":
      case "pmt":
        return "currency";
    }
  }

  if (item.page === "macro" && typeof item.inputs.calculator === "string") {
    switch (item.inputs.calculator) {
      case "inflation":
      case "realRate":
        return "percent";
      case "ppp":
        return "ratio";
      case "purchasingPower":
      case "cpiAdjust":
        return "currency";
    }
  }

  if (
    item.page === "options" &&
    (item.inputs.impliedOptionType === "call" || item.inputs.impliedOptionType === "put")
  ) {
    return "percentDecimal";
  }

  return null;
}

function inferHistoryFormat(item: CalculationHistoryItem): HistoryResultFormat {
  const inputFormat = inferHistoryFormatFromInputs(item);
  if (inputFormat) return inputFormat;

  const label = item.label?.toLowerCase() ?? "";

  if (item.page === "portfolio" || label.includes("sharpe") || label.includes("ratio")) {
    return "ratio";
  }

  if (label.includes("wacc") || label.includes("capm")) {
    return "percentDecimal";
  }

  if (label.includes("rate") || label.includes("irr") || label.includes("return")) {
    return Math.abs(item.result) <= 1 ? "percentDecimal" : "percent";
  }

  if (label.includes("period")) {
    return "periods";
  }

  return "currency";
}

export function formatHistoryResult(item: CalculationHistoryItem, options: HistoryFormatOptions = {}) {
  if (!Number.isFinite(item.result)) {
    return options.notAvailable ?? "N/A";
  }

  const format = item.resultFormat ?? inferHistoryFormat(item);

  switch (format) {
    case "currency":
      return formatCurrency(item.result, options.locale);
    case "percent":
      return `${formatNumber(item.result, 4, options.locale)}%`;
    case "percentDecimal":
      return `${formatNumber(item.result * 100, 4, options.locale)}%`;
    case "periods":
      return `${formatNumber(item.result, 2, options.locale)} ${item.resultUnit ?? options.periodsUnit ?? "periods"}`;
    case "years":
      return `${formatNumber(item.result, 2, options.locale)} ${item.resultUnit ?? options.yearsUnit ?? "years"}`;
    case "ratio":
    case "number":
      return formatNumber(item.result, 4, options.locale);
    default:
      return formatNumber(item.result, 4, options.locale);
  }
}

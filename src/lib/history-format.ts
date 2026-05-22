import type { CalculationHistoryItem, HistoryResultFormat } from "@/hooks/use-calculation-history";
import { formatCurrency, formatNumber } from "@/lib/utils";

function inferHistoryFormat(item: CalculationHistoryItem): HistoryResultFormat {
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

export function formatHistoryResult(item: CalculationHistoryItem) {
  if (!Number.isFinite(item.result)) {
    return "N/A";
  }

  const format = item.resultFormat ?? inferHistoryFormat(item);

  switch (format) {
    case "currency":
      return formatCurrency(item.result);
    case "percent":
      return `${formatNumber(item.result, 4)}%`;
    case "percentDecimal":
      return `${formatNumber(item.result * 100, 4)}%`;
    case "periods":
      return `${formatNumber(item.result, 2)} ${item.resultUnit ?? "periods"}`;
    case "years":
      return `${formatNumber(item.result, 2)} ${item.resultUnit ?? "years"}`;
    case "ratio":
    case "number":
      return formatNumber(item.result, 4);
    default:
      return formatNumber(item.result, 4);
  }
}

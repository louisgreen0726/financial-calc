import { escapeHtml } from "@/lib/sanitize";

type ShareValue = number | string;

export interface ShareMarkdownLabels {
  inputsHeading: string;
  resultsHeading: string;
  parameterLabel: string;
  metricLabel: string;
  valueLabel: string;
}

export interface ShareMarkdownPayload {
  title: string;
  results: Record<string, ShareValue>;
  inputs?: Record<string, ShareValue>;
  labels: ShareMarkdownLabels;
  formatResultValue: (value: ShareValue) => string;
}

/** Escape user-controlled text before emitting it into Markdown or Markdown table cells. */
export function escapeMarkdownText(value: ShareValue): string {
  return escapeHtml(String(value))
    .replace(/([\\`*_[\]])/g, "\\$1")
    .replace(/\r\n?|\n/g, "<br>");
}

export function escapeMarkdownTableCell(value: ShareValue): string {
  return escapeMarkdownText(value).replace(/\|/g, "\\|");
}

export function generateShareMarkdown({
  title,
  results,
  inputs,
  labels,
  formatResultValue,
}: ShareMarkdownPayload): string {
  const lines = [`## ${escapeMarkdownText(title)}\n`];

  if (inputs) {
    lines.push(`### ${escapeMarkdownText(labels.inputsHeading)}\n`);
    lines.push(
      `| ${escapeMarkdownTableCell(labels.parameterLabel)} | ${escapeMarkdownTableCell(labels.valueLabel)} |\n|---|---|\n`
    );
    Object.entries(inputs).forEach(([key, value]) => {
      lines.push(`| ${escapeMarkdownTableCell(key)} | ${escapeMarkdownTableCell(value)} |\n`);
    });
    lines.push("\n");
  }

  lines.push(`### ${escapeMarkdownText(labels.resultsHeading)}\n`);
  lines.push(
    `| ${escapeMarkdownTableCell(labels.metricLabel)} | ${escapeMarkdownTableCell(labels.valueLabel)} |\n|---|---|\n`
  );
  Object.entries(results).forEach(([key, value]) => {
    lines.push(`| ${escapeMarkdownTableCell(key)} | ${escapeMarkdownTableCell(formatResultValue(value))} |\n`);
  });

  return lines.join("");
}

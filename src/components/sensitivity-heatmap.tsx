"use client";

import { cn } from "@/lib/utils";

type Props = {
  data: number[][];
  rowLabels: string[];
  colLabels: string[];
  formatCell: (v: number) => string;
  caption: string;
  cornerLabel: string;
  className?: string;
};

// Simple 2D heatmap table with colored cells based on value magnitude
export function SensitivityHeatmap({ data, rowLabels, colLabels, formatCell, caption, cornerLabel, className }: Props) {
  // Determine min/max for color scaling
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (let r = 0; r < data.length; r++) {
    const row = data[r];
    for (let c = 0; c < row.length; c++) {
      const v = row[c];
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  const range = max - min;

  const cellLevel = (value: number) => {
    if (!Number.isFinite(value) || range <= 0) return 4;
    return Math.min(8, Math.max(0, Math.round(((value - min) / range) * 8)));
  };

  return (
    <div
      role="region"
      aria-label={caption}
      tabIndex={0}
      className={cn("max-w-full overflow-x-auto rounded-lg bg-blue-50 p-1 dark:bg-blue-950", className)}
    >
      <table className="min-w-[640px] border-collapse overflow-hidden rounded-lg">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="bg-muted">
            <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground min-w-[80px]">
              {cornerLabel}
            </th>
            {colLabels.map((cl) => (
              <th
                key={cl}
                scope="col"
                className="px-4 py-3 text-center text-sm font-semibold text-muted-foreground min-w-[80px]"
              >
                {cl}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`} className="hover:bg-muted/50 transition-colors">
              <th scope="row" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground bg-muted/30">
                {rowLabels[rowIndex]}
              </th>
              {row.map((val, colIndex) => (
                <td
                  key={`cell-${rowIndex}-${colIndex}`}
                  className="heatmap-cell px-4 py-3 text-right font-mono text-sm font-medium"
                  data-heatmap-level={cellLevel(val)}
                >
                  {formatCell(val)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SensitivityHeatmap;

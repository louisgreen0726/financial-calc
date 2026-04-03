"use client";

import * as React from "react";
import { useTheme } from "next-themes";

type Props = {
  data: number[][];
  rowLabels: string[];
  colLabels: string[];
  formatCell: (v: number) => string;
};

// Simple 2D heatmap table with colored cells based on value magnitude
export function SensitivityHeatmap({ data, rowLabels, colLabels, formatCell }: Props) {
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

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const cellColor = (value: number) => {
    // Guard against degenerate data
    if (!Number.isFinite(value) || range <= 0) {
      return isDark ? "hsl(210, 70%, 25%)" : "hsl(210, 70%, 60%)";
    }
    const t = (value - min) / range; // 0..1
    const hue = 210 - t * 20; // 210 -> 190

    // Light mode: 60% down to 48%
    // Dark mode: 20% up to 35% (so cells are distinct from dark bg but readable)
    const light = isDark ? 20 + t * 15 : 60 - t * 12;

    return `hsl(${hue}, 70%, ${light}%)`;
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-muted">
            <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground min-w-[80px]">
              YTM \ Years
            </th>
            {colLabels.map((cl) => (
              <th key={cl} className="px-4 py-3 text-center text-sm font-semibold text-muted-foreground min-w-[80px]">
                {cl}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`} className="hover:bg-muted/50 transition-colors">
              <td className="px-4 py-3 text-sm font-medium text-muted-foreground bg-muted/30">{rowLabels[rowIndex]}</td>
              {row.map((val, colIndex) => (
                <td
                  key={`cell-${rowIndex}-${colIndex}`}
                  className="px-4 py-3 text-right font-mono text-sm font-medium"
                  style={{
                    backgroundColor: cellColor(val),
                    color: isDark ? "hsl(0, 0%, 95%)" : "hsl(0, 0%, 15%)",
                  }}
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

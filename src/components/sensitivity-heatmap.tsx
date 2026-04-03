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
    <div style={{ width: "100%", overflowX: "auto" }}>
      <table aria-label="Sensitivity heatmap" style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={{ padding: "8px 12px", textAlign: "left", minWidth: 60 }}></th>
            {colLabels.map((cl) => (
              <th
                key={cl}
                style={{ padding: "8px 12px", textAlign: "center", fontSize: 12, color: "var(--muted-foreground)" }}
              >
                {cl}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`}>
              <td style={{ padding: "8px 12px", fontSize: 12, color: "var(--muted-foreground)" }}>
                {rowLabels[rowIndex]}
              </td>
              {row.map((val, colIndex) => (
                <td
                  key={`cell-${rowIndex}-${colIndex}`}
                  style={{
                    padding: "6px 10px",
                    textAlign: "right",
                    backgroundColor: cellColor(val),
                    border: "1px solid hsl(var(--border))",
                    minWidth: 60,
                  }}
                >
                  <span style={{ fontFamily: "ui-sans-serif, system-ui", fontSize: 12 }}>{formatCell(val)}</span>
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

/**
 * Recharts theme for dark/light mode compatibility
 */

export interface ChartTheme {
  primary: string;
  secondary: string;
  tertiary: string;
  quaternary: string;
  quinary: string;
  grid: string;
  tooltipBg: string;
  tooltipText: string;
  axisText: string;
  dotStroke: string;
}

export const lightTheme: ChartTheme = {
  primary: "hsl(158 64% 52%)",
  secondary: "hsl(210 70% 55%)",
  tertiary: "hsl(25 80% 55%)",
  quaternary: "hsl(280 65% 60%)",
  quinary: "hsl(340 75% 55%)",
  grid: "hsl(240 5% 90%)",
  tooltipBg: "hsl(0 0% 100%)",
  tooltipText: "hsl(240 10% 3.9%)",
  axisText: "hsl(240 3.8% 46.1%)",
  dotStroke: "hsl(0 0% 100%)",
};

export const darkTheme: ChartTheme = {
  primary: "hsl(158 64% 60%)", // Brighter for dark bg
  secondary: "hsl(210 70% 65%)",
  tertiary: "hsl(25 80% 65%)",
  quaternary: "hsl(280 65% 70%)",
  quinary: "hsl(340 75% 65%)",
  grid: "hsl(240 3.7% 15.9%)",
  tooltipBg: "hsl(240 10% 7%)",
  tooltipText: "hsl(0 0% 98%)",
  axisText: "hsl(240 5% 64.9%)",
  dotStroke: "hsl(240 10% 7%)",
};

/** Hook-friendly theme getter */
export function getChartTheme(isDark: boolean): ChartTheme {
  return isDark ? darkTheme : lightTheme;
}

/** Shared Recharts tooltip content style */
export const chartTooltipStyle = {
  rounded: "rounded-lg border bg-card shadow-sm px-3 py-2",
  labelStyle: "text-sm font-medium",
  itemStyle: "text-xs",
};

/** Gradient fill definitions for area charts */
export const areaGradient = {
  light: { from: "hsl(158 64% 52% / 0.4)", to: "hsl(158 64% 52% / 0.02)" },
  dark: { from: "hsl(158 64% 60% / 0.3)", to: "hsl(158 64% 60% / 0.02)" },
};

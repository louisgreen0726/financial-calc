export type ReportFieldValues = Record<string, number | string>;

export function labelReportFields(values: ReportFieldValues | undefined, labels: Record<string, string> | undefined) {
  if (!values) return undefined;

  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => {
      const label = labels?.[key]?.trim();
      return [label || key, value];
    })
  );
}

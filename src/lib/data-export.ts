export const DATA_EXPORT_SCHEMA_VERSION = 1;

interface ReportExportSource {
  title: string;
  inputs?: Record<string, number | string>;
  results: Record<string, number | string>;
  data?: unknown;
}

interface ReportCsvSource extends ReportExportSource {
  tabularData?: Record<string, unknown>[];
}

interface DownloadTextFileOptions {
  content: string;
  filename: string;
  extension: string;
  mimeType: string;
}

function shouldPrefixCsvFormula(value: unknown, text: string) {
  return typeof value === "string" && /^[\u0000-\u0020=+\-@\u007f-\u009f]/.test(text);
}

function serializeJsonValue(_key: string, value: unknown) {
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new TypeError("Cannot export a non-finite number as JSON");
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (typeof value === "function" || typeof value === "symbol") {
    throw new TypeError("Cannot export a " + typeof value + " as JSON");
  }

  return value;
}

function formatCsvValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object") {
    return serializeJson(value, 0);
  }

  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new TypeError("Cannot export a non-finite number as CSV");
  }

  return String(value);
}

function prefixRecord(prefix: string, record: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [prefix + "." + key, value]));
}

export function escapeCsvCell(value: unknown) {
  const rawValue = formatCsvValue(value);
  const stringValue = shouldPrefixCsvFormula(value, rawValue) ? "'" + rawValue : rawValue;

  if (/[,\"\r\n]/.test(stringValue)) {
    return '"' + stringValue.replace(/"/g, '""') + '"';
  }

  return stringValue;
}

export function getCsvHeaders(data: Record<string, unknown>[]) {
  const headers = new Set<string>();
  data.forEach((row) => Object.keys(row).forEach((key) => headers.add(key)));
  return Array.from(headers);
}

export function serializeCsv(data: Record<string, unknown>[], headers?: string[]) {
  if (data.length === 0) {
    return "";
  }

  const csvHeaders = headers ?? getCsvHeaders(data);
  return [
    csvHeaders.map(escapeCsvCell).join(","),
    ...data.map((row) => csvHeaders.map((header) => escapeCsvCell(row[header])).join(",")),
  ].join("\r\n");
}

export function serializeJson(data: unknown, space = 2) {
  if (data === undefined) {
    throw new TypeError("Cannot export undefined as JSON");
  }

  const serialized = JSON.stringify(data, serializeJsonValue, space);
  if (serialized === undefined) {
    throw new TypeError("Unable to serialize JSON export");
  }

  return serialized;
}

export function createReportExportEnvelope(
  { title, inputs = {}, results, data }: ReportExportSource,
  exportedAt = new Date().toISOString()
) {
  return {
    schemaVersion: DATA_EXPORT_SCHEMA_VERSION,
    exportedAt,
    report: {
      title,
      inputs,
      results,
    },
    ...(data !== undefined ? { data } : {}),
  };
}

export function createReportCsvRows(
  { title, inputs = {}, results, tabularData }: ReportCsvSource,
  exportedAt = new Date().toISOString()
) {
  const context = {
    "report.schemaVersion": DATA_EXPORT_SCHEMA_VERSION,
    "report.exportedAt": exportedAt,
    "report.title": title,
    ...prefixRecord("input", inputs),
    ...prefixRecord("result", results),
  };

  if (!tabularData || tabularData.length === 0) {
    return [context];
  }

  return tabularData.map((row) => ({ ...context, ...prefixRecord("data", row) }));
}

export function normalizeExportFilename(filename: string, extension: string) {
  const normalizedExtension = extension.replace(/^\.+/, "").toLowerCase() || "txt";
  const extensionSuffix = "." + normalizedExtension;
  const trimmedFilename = filename.trim();
  const withoutExtension = trimmedFilename.toLowerCase().endsWith(extensionSuffix)
    ? trimmedFilename.slice(0, -extensionSuffix.length)
    : trimmedFilename;
  let basename = withoutExtension
    .normalize("NFC")
    .replace(/[\u0000-\u001f\u007f-\u009f<>:"/\\|?*]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/^\.+|\.+$/g, "")
    .trim()
    .slice(0, 120);

  if (!basename) {
    basename = "export";
  } else if (/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(basename)) {
    basename = "_" + basename;
  }

  return basename + "." + normalizedExtension;
}

export function downloadTextFile({ content, filename, extension, mimeType }: DownloadTextFileOptions) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const downloadFilename = normalizeExportFilename(filename, extension);

  link.href = url;
  link.download = downloadFilename;
  link.hidden = true;
  document.body.appendChild(link);

  try {
    link.click();
  } finally {
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return downloadFilename;
}

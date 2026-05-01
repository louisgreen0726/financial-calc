"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n";
import { logger } from "@/lib/logger";

interface UseExportOptions {
  filename?: string;
}

export function useExport({ filename = "export" }: UseExportOptions = {}) {
  const { t } = useLanguage();

  const exportToCSV = useCallback(
    (data: Record<string, unknown>[], headers?: string[]) => {
      try {
        if (data.length === 0) {
          toast.error(t("export.noData"));
          return;
        }

        // Generate headers from first row if not provided
        const csvHeaders = headers || Object.keys(data[0]);

        // Create CSV content
        const csvContent = [
          csvHeaders.join(","),
          ...data.map((row) =>
            csvHeaders
              .map((header) => {
                const value = row[header];
                // Escape values containing commas or quotes
                const stringValue = String(value ?? "");
                if (/[,\"\r\n]/.test(stringValue)) {
                  return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
              })
              .join(",")
          ),
        ].join("\n");

        // Create and download file
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute("download", `${filename}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(t("export.csvSuccess"));
      } catch (error) {
        logger.error("Export error:", error);
        toast.error(t("export.csvError"));
      }
    },
    [filename, t]
  );

  const exportToJSON = useCallback(
    (data: unknown) => {
      try {
        const jsonContent = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonContent], { type: "application/json" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute("download", `${filename}.json`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(t("export.jsonSuccess"));
      } catch (error) {
        logger.error("Export error:", error);
        toast.error(t("export.jsonError"));
      }
    },
    [filename, t]
  );

  return { exportToCSV, exportToJSON };
}

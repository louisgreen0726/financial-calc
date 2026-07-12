"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n";
import { logger } from "@/lib/logger";
import { downloadTextFile, serializeCsv, serializeJson } from "@/lib/data-export";

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

        downloadTextFile({
          content: "\uFEFF" + serializeCsv(data, headers),
          filename,
          extension: "csv",
          mimeType: "text/csv;charset=utf-8",
        });
        toast.success(t("export.csvSuccess"));
      } catch (error) {
        logger.error("CSV export error:", error);
        toast.error(t("export.csvError"));
      }
    },
    [filename, t]
  );

  const exportToJSON = useCallback(
    (data: unknown) => {
      try {
        downloadTextFile({
          content: serializeJson(data),
          filename,
          extension: "json",
          mimeType: "application/json;charset=utf-8",
        });
        toast.success(t("export.jsonSuccess"));
      } catch (error) {
        logger.error("JSON export error:", error);
        toast.error(t("export.jsonError"));
      }
    },
    [filename, t]
  );

  return { exportToCSV, exportToJSON };
}

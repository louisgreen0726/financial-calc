"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileJson, FileText } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useExport } from "@/hooks/use-export";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { createReportCsvRows, createReportExportEnvelope } from "@/lib/data-export";

interface ExportMenuProps {
  data?: Record<string, unknown>[];
  jsonData?: Record<string, unknown> | unknown[];
  pdfElementId?: string;
  pdfTitle?: string;
  pdfFilename?: string;
  reportInputs?: Record<string, number | string>;
  rawReportInputs?: Record<string, number | string>;
  reportResults?: Record<string, number | string>;
  onPrintModeChange?: (isPrinting: boolean) => void;
  className?: string;
}

export function ExportMenu({
  data,
  jsonData,
  pdfElementId,
  pdfTitle,
  pdfFilename = "export",
  reportInputs,
  rawReportInputs,
  reportResults,
  onPrintModeChange,
  className,
}: ExportMenuProps) {
  const { t } = useLanguage();
  const { exportToCSV, exportToJSON } = useExport({ filename: pdfFilename });
  const [isExporting, setIsExporting] = useState(false);
  const resolvedReportTitle = pdfTitle ?? t("export.reportTitle");
  const hasReportData = reportResults !== undefined;

  const handleExportCSV = () => {
    if (hasReportData) {
      exportToCSV(
        createReportCsvRows({
          title: resolvedReportTitle,
          inputs: reportInputs,
          rawInputs: rawReportInputs,
          results: reportResults,
          tabularData: data,
        })
      );
      return;
    }

    exportToCSV(data ?? []);
  };

  const handleExportJSON = () => {
    if (hasReportData) {
      exportToJSON(
        createReportExportEnvelope({
          title: resolvedReportTitle,
          inputs: reportInputs,
          rawInputs: rawReportInputs,
          results: reportResults,
          data: jsonData,
        })
      );
      return;
    }

    exportToJSON(jsonData);
  };

  const handlePrintReport = async () => {
    if (!pdfElementId) {
      return;
    }

    setIsExporting(true);
    try {
      const { printReport } = await import("@/lib/print-report");
      await printReport({
        filename: pdfFilename,
        elementId: pdfElementId,
        title: resolvedReportTitle,
        generatedLabel: t("export.generatedAt"),
        onPrintModeChange,
      });
    } catch (error) {
      toast.error(t("export.pdfError"));
      logger.error("Report print error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  // Determine what export options to show
  const hasData = data && data.length > 0;
  const hasCsvData = hasData || hasReportData;
  const hasJsonData = jsonData !== undefined || hasReportData;
  const canExport = hasCsvData || hasJsonData || pdfElementId;

  if (!canExport) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn("min-h-10 min-w-0 gap-2", className)} disabled={isExporting}>
          <Download className="h-4 w-4" />
          <span className="truncate">{t("export.title")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[12rem]">
        {hasCsvData && (
          <DropdownMenuItem onClick={handleExportCSV} className="min-h-10 cursor-pointer">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            {t("export.csv")}
          </DropdownMenuItem>
        )}
        {hasJsonData && (
          <DropdownMenuItem onClick={handleExportJSON} className="min-h-10 cursor-pointer">
            <FileJson className="h-4 w-4 text-blue-600" />
            {t("export.json")}
          </DropdownMenuItem>
        )}
        {(hasCsvData || hasJsonData) && pdfElementId && <DropdownMenuSeparator />}
        {pdfElementId && (
          <DropdownMenuItem onClick={handlePrintReport} className="min-h-10 cursor-pointer">
            <FileText className="h-4 w-4 text-red-600" />
            {t("export.pdf")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

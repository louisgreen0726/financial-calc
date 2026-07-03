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
import { exportToPDF } from "@/lib/pdf-export";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";

interface ExportMenuProps {
  data?: Record<string, unknown>[];
  jsonData?: Record<string, unknown> | unknown[];
  pdfElementId?: string;
  pdfTitle?: string;
  pdfFilename?: string;
  className?: string;
}

export function ExportMenu({
  data,
  jsonData,
  pdfElementId,
  pdfTitle,
  pdfFilename = "export",
  className,
}: ExportMenuProps) {
  const { t } = useLanguage();
  const { exportToCSV, exportToJSON } = useExport({ filename: pdfFilename });
  const [isExporting, setIsExporting] = useState(false);
  const resolvedPdfTitle = pdfTitle ?? t("export.reportTitle");

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportToPDF({
        filename: pdfFilename,
        elementId: pdfElementId,
        title: resolvedPdfTitle,
      });
      toast.success(t("export.pdfSuccess"));
    } catch (error) {
      toast.error(t("export.pdfError"));
      logger.error("PDF export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  // Determine what export options to show
  const hasData = data && data.length > 0;
  const hasJsonData = jsonData !== undefined;
  const canExport = hasData || hasJsonData || pdfElementId;

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
        {hasData && (
          <DropdownMenuItem onClick={() => exportToCSV(data)} className="min-h-10 cursor-pointer">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            {t("export.csv")}
          </DropdownMenuItem>
        )}
        {hasJsonData && (
          <DropdownMenuItem onClick={() => exportToJSON(jsonData)} className="min-h-10 cursor-pointer">
            <FileJson className="h-4 w-4 text-blue-600" />
            {t("export.json")}
          </DropdownMenuItem>
        )}
        {(hasData || hasJsonData) && pdfElementId && <DropdownMenuSeparator />}
        {pdfElementId && (
          <DropdownMenuItem onClick={handleExportPDF} className="min-h-10 cursor-pointer">
            <FileText className="h-4 w-4 text-red-600" />
            {t("export.pdf")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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
  pdfTitle = "Financial Calculation Report",
  pdfFilename = "export",
  className,
}: ExportMenuProps) {
  const { t } = useLanguage();
  const { exportToCSV, exportToJSON } = useExport({ filename: pdfFilename });
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportToPDF({
        filename: pdfFilename,
        elementId: pdfElementId,
        title: pdfTitle,
      });
      toast.success(t("export.pdfSuccess"));
    } catch (error) {
      toast.error(t("export.pdfError"));
      console.error("PDF export error:", error);
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
        <Button variant="outline" size="sm" className={className} disabled={isExporting}>
          <Download className="h-4 w-4 mr-2" />
          {t("export.title")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {hasData && (
          <DropdownMenuItem onClick={() => exportToCSV(data)} className="cursor-pointer">
            <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" />
            {t("export.csv")}
          </DropdownMenuItem>
        )}
        {hasJsonData && (
          <DropdownMenuItem onClick={() => exportToJSON(jsonData)} className="cursor-pointer">
            <FileJson className="h-4 w-4 mr-2 text-blue-600" />
            {t("export.json")}
          </DropdownMenuItem>
        )}
        {(hasData || hasJsonData) && pdfElementId && <DropdownMenuSeparator />}
        <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer">
          <FileText className="h-4 w-4 mr-2 text-red-600" />
          {t("export.pdf")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

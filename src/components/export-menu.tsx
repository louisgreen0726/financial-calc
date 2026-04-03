"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  pdfFilename?: string;
  className?: string;
}

export function ExportMenu({ data, jsonData, pdfElementId, pdfFilename = "export", className }: ExportMenuProps) {
  const { t } = useLanguage();
  const { exportToCSV, exportToJSON } = useExport({ filename: pdfFilename });
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportToPDF({
        filename: pdfFilename,
        elementId: pdfElementId,
      });
      toast.success(t("export.pdfSuccess"));
    } catch {
      toast.error(t("export.pdfError"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className} disabled={isExporting}>
          <Download className="h-4 w-4 mr-2" />
          {t("export.title")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {data && (
          <DropdownMenuItem onClick={() => exportToCSV(data)}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {t("export.csv")}
          </DropdownMenuItem>
        )}
        {jsonData && (
          <DropdownMenuItem onClick={() => exportToJSON(jsonData)}>
            <FileJson className="h-4 w-4 mr-2" />
            {t("export.json")}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleExportPDF}>
          <FileText className="h-4 w-4 mr-2" />
          {t("export.pdf")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

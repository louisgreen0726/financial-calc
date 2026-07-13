import { ExportMenu } from "@/components/export-menu";
import { ShareDialog } from "@/components/share-dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { labelReportFields } from "@/lib/report-fields";
import { History, Share2 } from "lucide-react";
import { useState } from "react";

interface ResultActionsBaseProps {
  title: string;
  results: Record<string, number | string>;
  shareUrl?: string;
  exportData?: Record<string, unknown>[];
  exportJson?: Record<string, unknown> | unknown[];
  pdfElementId?: string;
  pdfFilename?: string;
  pdfTitle?: string;
  onPrintModeChange?: (isPrinting: boolean) => void;
  onShowHistory?: () => void;
}

type ResultActionsProps = ResultActionsBaseProps &
  (
    | {
        inputs: Record<string, number | string>;
        displayInputs?: Record<string, number | string>;
        inputLabels: Record<string, string>;
      }
    | {
        inputs?: undefined;
        displayInputs?: never;
        inputLabels?: never;
      }
  );

export function ResultActions({
  title,
  results,
  inputs,
  displayInputs,
  inputLabels,
  shareUrl,
  exportData,
  exportJson,
  pdfElementId,
  pdfFilename,
  pdfTitle,
  onPrintModeChange,
  onShowHistory,
}: ResultActionsProps) {
  const { t } = useLanguage();
  const [shareOpen, setShareOpen] = useState(false);
  const reportInputs = labelReportFields(displayInputs ?? inputs, inputLabels);

  return (
    <>
      <div className="flex flex-wrap gap-2" data-pdf-exclude="true">
        <Button variant="outline" size="sm" className="min-h-10 min-w-0 gap-2" onClick={() => setShareOpen(true)}>
          <Share2 className="h-4 w-4" />
          <span className="truncate">{t("share.title")}</span>
        </Button>
        <ExportMenu
          data={exportData}
          jsonData={exportJson}
          pdfElementId={pdfElementId}
          pdfFilename={pdfFilename}
          pdfTitle={pdfTitle}
          reportInputs={reportInputs}
          rawReportInputs={inputs}
          reportResults={results}
          onPrintModeChange={onPrintModeChange}
          className="min-h-10 gap-2"
        />
        {onShowHistory ? (
          <Button variant="outline" size="sm" className="min-h-10 min-w-0 gap-2" onClick={onShowHistory}>
            <History className="h-4 w-4" />
            <span className="truncate">{t("history.title")}</span>
          </Button>
        ) : null}
      </div>

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        title={title}
        results={results}
        inputs={reportInputs}
        shareUrl={shareUrl}
        printElementId={pdfElementId}
        printFilename={pdfFilename}
        onPrintModeChange={onPrintModeChange}
      />
    </>
  );
}

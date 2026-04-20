import { ExportMenu } from "@/components/export-menu";
import { ShareDialog } from "@/components/share-dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { Download, History, Share2 } from "lucide-react";
import { useState } from "react";

interface ResultActionsProps {
  title: string;
  results: Record<string, number>;
  inputs?: Record<string, number | string>;
  shareUrl?: string;
  exportData?: Record<string, unknown>[];
  exportJson?: Record<string, unknown> | unknown[];
  pdfElementId?: string;
  pdfFilename?: string;
  pdfTitle?: string;
  onShowHistory?: () => void;
}

export function ResultActions({
  title,
  results,
  inputs,
  shareUrl,
  exportData,
  exportJson,
  pdfElementId,
  pdfFilename,
  pdfTitle,
  onShowHistory,
}: ResultActionsProps) {
  const { t } = useLanguage();
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setShareOpen(true)}>
          <Share2 className="h-4 w-4" />
          {t("share.title")}
        </Button>
        <ExportMenu
          data={exportData}
          jsonData={exportJson}
          pdfElementId={pdfElementId}
          pdfFilename={pdfFilename}
          pdfTitle={pdfTitle}
          className="gap-2"
        />
        {onShowHistory ? (
          <Button variant="outline" size="sm" className="gap-2" onClick={onShowHistory}>
            <History className="h-4 w-4" />
            {t("history.title")}
          </Button>
        ) : null}
      </div>

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        title={title}
        results={results}
        inputs={inputs}
        shareUrl={shareUrl}
      />
    </>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";
import { Share2, Link2, FileText, Copy, Download, Check } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { copyTextToClipboard } from "@/lib/clipboard";
import { logger } from "@/lib/logger";
import { generateShareMarkdown } from "@/lib/share-markdown";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  results: Record<string, number | string>;
  inputs?: Record<string, number | string>;
  shareUrl?: string;
  className?: string;
}

/**
 * Share calculation results as link, markdown, or image.
 */
export function ShareDialog({ open, onOpenChange, title, results, inputs, shareUrl, className }: ShareDialogProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState<string | null>(null);
  const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;
  const hasShareUrl = Boolean(shareUrl);
  const resolvedShareUrl = shareUrl ?? "";

  const formatResultValue = (value: number | string): string => {
    if (typeof value === "string") {
      return value;
    }

    return formatCurrency(value);
  };

  const generateMarkdown = (): string => {
    return generateShareMarkdown({
      title,
      results,
      inputs,
      labels: {
        inputsHeading: t("share.inputsHeading"),
        resultsHeading: t("share.resultsHeading"),
        parameterLabel: t("share.parameterLabel"),
        metricLabel: t("share.metricLabel"),
        valueLabel: t("share.valueLabel"),
      },
      formatResultValue,
    });
  };

  const generatePlainText = (): string => {
    const lines = [`${title}\n${"=".repeat(title.length)}\n`];
    if (inputs) {
      lines.push(`${t("share.inputsHeading")}:`);
      Object.entries(inputs).forEach(([k, v]) => lines.push(`  ${k}: ${v}`));
      lines.push("");
    }
    lines.push(`${t("share.resultsHeading")}:`);
    Object.entries(results).forEach(([k, v]) => lines.push(`  ${k}: ${formatResultValue(v)}`));
    return lines.join("\n");
  };

  const shareText = generatePlainText();

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await copyTextToClipboard(text);
      setCopied(key);
      toast.success(t("common.copySuccess"));
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      logger.error("Failed to copy share payload:", error);
      toast.error(t("common.copyError"));
    }
  };

  const copyLink = () => {
    copyToClipboard(resolvedShareUrl, "link");
  };

  const copyMarkdown = () => {
    copyToClipboard(generateMarkdown(), "markdown");
  };

  const copyPlainText = () => {
    copyToClipboard(generatePlainText(), "text");
  };

  const shareNative = async () => {
    if (!canNativeShare) {
      copyPlainText();
      return;
    }

    try {
      await navigator.share({
        title,
        text: shareText,
        ...(hasShareUrl ? { url: resolvedShareUrl } : {}),
      });
    } catch {
      // user cancelled or unsupported payload; keep silent
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-pdf-exclude="true"
        className={cn("no-print sm:max-w-md", className)}
        closeLabel={t("common.close")}
      >
        <DialogHeader>
          <DialogTitle className="flex min-w-0 items-center gap-2">
            <Share2 className="h-5 w-5 shrink-0" />
            <span className="min-w-0 break-words">{t("share.title")}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {canNativeShare && (
            <Button className="min-h-11 w-full min-w-0 justify-start gap-3" onClick={shareNative}>
              <Share2 className="h-4 w-4 shrink-0" />
              <span className="min-w-0 truncate">{t("share.title")}</span>
            </Button>
          )}

          {hasShareUrl ? (
            <Button variant="outline" className="min-h-11 w-full min-w-0 justify-start gap-3" onClick={copyLink}>
              {copied === "link" ? <Check className="h-4 w-4 text-emerald-500" /> : <Link2 className="h-4 w-4" />}
              <span className="min-w-0 truncate">{t("share.copyLink")}</span>
            </Button>
          ) : null}

          <Button variant="outline" className="min-h-11 w-full min-w-0 justify-start gap-3" onClick={copyMarkdown}>
            {copied === "markdown" ? <Check className="h-4 w-4 text-emerald-500" /> : <FileText className="h-4 w-4" />}
            <span className="min-w-0 truncate">{t("share.copyMarkdown")}</span>
          </Button>

          <Button variant="outline" className="min-h-11 w-full min-w-0 justify-start gap-3" onClick={copyPlainText}>
            {copied === "text" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            <span className="min-w-0 truncate">{t("share.copyText")}</span>
          </Button>

          <Button
            variant="outline"
            className="min-h-11 w-full min-w-0 justify-start gap-3"
            onClick={() => window.print()}
          >
            <Download className="h-4 w-4 shrink-0" />
            <span className="min-w-0 truncate">{t("share.print")}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

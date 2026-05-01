"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";
import { Share2, Link2, FileText, Copy, Download, Check } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

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

  const formatMarkdownCell = (value: number | string): string => {
    return String(value).replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
  };

  const generateMarkdown = (): string => {
    const lines = [`## ${title}\n`];
    if (inputs) {
      lines.push(`### ${t("share.inputsHeading")}\n`);
      lines.push(`| ${t("share.parameterLabel")} | ${t("share.valueLabel")} |\n|---|---|\n`);
      Object.entries(inputs).forEach(([k, v]) => {
        lines.push(`| ${formatMarkdownCell(k)} | ${formatMarkdownCell(v)} |\n`);
      });
      lines.push("\n");
    }
    lines.push(`### ${t("share.resultsHeading")}\n`);
    lines.push(`| ${t("share.metricLabel")} | ${t("share.valueLabel")} |\n|---|---|\n`);
    Object.entries(results).forEach(([k, v]) => {
      lines.push(`| ${formatMarkdownCell(k)} | ${formatMarkdownCell(formatResultValue(v))} |\n`);
    });
    return lines.join("");
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
      await navigator.clipboard.writeText(text);
      setCopied(key);
      toast.success(t("common.copySuccess") || "Copied!");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error(t("common.copyError") || "Failed to copy");
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
      <DialogContent className={cn("sm:max-w-md", className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {t("share.title") || "Share Results"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {canNativeShare && (
            <Button className="w-full justify-start gap-3" onClick={shareNative}>
              <Share2 className="h-4 w-4" />
              <span>{t("share.title") || "Share Results"}</span>
            </Button>
          )}

          {hasShareUrl ? (
            <Button variant="outline" className="w-full justify-start gap-3" onClick={copyLink}>
              {copied === "link" ? <Check className="h-4 w-4 text-emerald-500" /> : <Link2 className="h-4 w-4" />}
              <span>{t("share.copyLink") || "Copy shareable link"}</span>
            </Button>
          ) : null}

          {/* Copy as Markdown */}
          <Button variant="outline" className="w-full justify-start gap-3" onClick={copyMarkdown}>
            {copied === "markdown" ? <Check className="h-4 w-4 text-emerald-500" /> : <FileText className="h-4 w-4" />}
            <span>{t("share.copyMarkdown") || "Copy as Markdown table"}</span>
          </Button>

          {/* Copy as Plain Text */}
          <Button variant="outline" className="w-full justify-start gap-3" onClick={copyPlainText}>
            {copied === "text" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            <span>{t("share.copyText") || "Copy as plain text"}</span>
          </Button>

          {/* Print / Save as PDF */}
          <Button variant="outline" className="w-full justify-start gap-3" onClick={() => window.print()}>
            <Download className="h-4 w-4" />
            <span>{t("share.print") || "Print / Save as PDF"}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

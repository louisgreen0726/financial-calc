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
  results: Record<string, number>;
  inputs?: Record<string, number | string>;
  className?: string;
}

/**
 * Share calculation results as link, markdown, or image.
 */
export function ShareDialog({ open, onOpenChange, title, results, inputs, className }: ShareDialogProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState<string | null>(null);
  const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;

  const generateMarkdown = (): string => {
    const lines = [`## ${title}\n`];
    if (inputs) {
      lines.push("### Inputs\n");
      lines.push("| Parameter | Value |\n|---|---|\n");
      Object.entries(inputs).forEach(([k, v]) => {
        lines.push(`| ${k} | ${v} |\n`);
      });
      lines.push("\n");
    }
    lines.push("### Results\n");
    lines.push("| Metric | Value |\n|---|---|\n");
    Object.entries(results).forEach(([k, v]) => {
      lines.push(`| ${k} | ${formatCurrency(v)} |\n`);
    });
    return lines.join("");
  };

  const generatePlainText = (): string => {
    const lines = [`${title}\n${"=".repeat(title.length)}\n`];
    if (inputs) {
      lines.push("Inputs:");
      Object.entries(inputs).forEach(([k, v]) => lines.push(`  ${k}: ${v}`));
      lines.push("");
    }
    lines.push("Results:");
    Object.entries(results).forEach(([k, v]) => lines.push(`  ${k}: ${formatCurrency(v)}`));
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
    const url = window.location.href;
    copyToClipboard(url, "link");
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
        url: window.location.href,
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

          {/* Copy Link */}
          <Button variant="outline" className="w-full justify-start gap-3" onClick={copyLink}>
            {copied === "link" ? <Check className="h-4 w-4 text-emerald-500" /> : <Link2 className="h-4 w-4" />}
            <span>{t("share.copyLink") || "Copy shareable link"}</span>
          </Button>

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

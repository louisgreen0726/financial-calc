"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { logger } from "@/lib/logger";
import { copyTextToClipboard } from "@/lib/clipboard";

interface CopyButtonProps {
  value: string | number;
  className?: string;
}

export function CopyButton({ value, className }: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const { t } = useLanguage();

  const handleCopy = React.useCallback(async () => {
    const textToCopy = String(value);

    try {
      await copyTextToClipboard(textToCopy);
      setCopied(true);
      toast.success(t("common.copySuccess") || "Copied to clipboard");

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      logger.error("Failed to copy:", error);
      toast.error(t("common.copyError") || "Failed to copy");
    }
  }, [value, t]);

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      onClick={handleCopy}
      aria-label={copied ? t("common.copied") || "Copied" : t("common.copy") || "Copy"}
    >
      {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
    </Button>
  );
}

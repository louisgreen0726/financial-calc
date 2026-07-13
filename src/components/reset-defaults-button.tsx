"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface ResetDefaultsButtonProps {
  urlPrefix: string;
  onReset: () => () => void;
  disabled?: boolean;
  clearUrlState?: boolean;
}

function notifyLocationChange() {
  window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
}

function replaceCalculatorUrl(urlPrefix: string) {
  const url = new URL(window.location.href);
  const keyPrefix = `${urlPrefix}_`;

  for (const key of [...url.searchParams.keys()]) {
    if (key.startsWith(keyPrefix)) url.searchParams.delete(key);
  }

  const query = url.searchParams.toString();
  const nextUrl = `${url.pathname}${query ? `?${query}` : ""}${url.hash}`;
  window.history.replaceState(window.history.state, "", nextUrl);
  notifyLocationChange();
}

export function ResetDefaultsButton({
  urlPrefix,
  onReset,
  disabled = false,
  clearUrlState = true,
}: ResetDefaultsButtonProps) {
  const { t } = useLanguage();

  const handleReset = () => {
    const previousUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const previousHistoryState = window.history.state;
    const restoreState = onReset();
    if (clearUrlState) replaceCalculatorUrl(urlPrefix);
    toast.success(t("common.defaultsRestored"), {
      action: {
        label: t("common.undo"),
        onClick: () => {
          window.history.replaceState(previousHistoryState, "", previousUrl);
          notifyLocationChange();
          restoreState();
        },
      },
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="min-h-10 gap-2"
      disabled={disabled}
      onClick={handleReset}
    >
      <RotateCcw />
      <span>{t("common.resetDefaults")}</span>
    </Button>
  );
}

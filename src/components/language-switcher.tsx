"use client";

import React from "react";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const LanguageSwitcher = React.memo(function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const visibleLabel = language === "en" ? "EN / 中文" : "中文 / EN";
  const nextLanguageLabel = language === "en" ? "Switch to Chinese" : "Switch to English";

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === "en" ? "zh" : "en")}
      className={cn(
        "h-9 gap-2 rounded-full px-3 text-xs font-medium transition-all hover:bg-primary/10",
        language === "zh" && "bg-primary/10 text-primary"
      )}
      aria-label={`${visibleLabel} - ${nextLanguageLabel}`}
    >
      <Languages className="h-4 w-4" />
      <span className="hidden sm:inline">{visibleLabel}</span>
      <span className="sm:hidden">{language === "en" ? "中" : "EN"}</span>
    </Button>
  );
});

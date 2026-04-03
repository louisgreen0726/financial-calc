"use client";

import React from "react";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

export const LanguageSwitcher = React.memo(function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === "en" ? "zh" : "en")}
      className={cn(
        "h-9 px-3 gap-2 rounded-full transition-all hover:bg-primary/10 font-medium text-xs",
        language === "zh" && "bg-primary/10 text-primary"
      )}
      aria-label={language === "en" ? "Switch to Chinese" : "切换到英文"}
    >
      <Languages className="h-4 w-4" />
      <span className="hidden sm:inline">{language === "en" ? "EN / 中文" : "中文 / EN"}</span>
      <span className="sm:hidden">{language === "en" ? "中" : "EN"}</span>
    </Button>
  );
});

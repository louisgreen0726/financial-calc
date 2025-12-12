"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
      className="w-9 px-0"
      title={language === 'en' ? "Switch to Chinese" : "切换到英文"}
    >
      <Globe className="h-4 w-4 mr-2" />
      {language === 'en' ? 'EN' : '中'}
    </Button>
  );
}

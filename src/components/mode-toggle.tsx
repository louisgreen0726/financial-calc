"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

export const ModeToggle = React.memo(function ModeToggle() {
  const { setTheme, theme } = useTheme();
  const { t } = useLanguage();
  const themeLabel = theme === "dark" ? t("common.dark") : theme === "light" ? t("common.light") : t("common.system");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-9 px-3 gap-2 rounded-full transition-all hover:bg-primary/10",
            theme === "dark" && "bg-primary/10 text-primary"
          )}
          aria-label={`${t("common.toggleTheme")}: ${themeLabel}`}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="text-xs font-medium hidden sm:inline">{themeLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px]">
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}
          aria-label={t("settings.theme")}
        >
          <DropdownMenuRadioItem value="light" className="cursor-pointer gap-2">
            <Sun className="h-4 w-4" />
            {t("common.light")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark" className="cursor-pointer gap-2">
            <Moon className="h-4 w-4" />
            {t("common.dark")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system" className="cursor-pointer gap-2">
            <Monitor className="h-4 w-4" />
            {t("common.system")}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

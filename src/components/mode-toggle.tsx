"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

export const ModeToggle = React.memo(function ModeToggle() {
  const { setTheme, theme } = useTheme();
  const { t } = useLanguage();

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
          aria-label={t("common.toggleTheme")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="text-xs font-medium hidden sm:inline">
            {theme === "dark" ? "深色" : theme === "light" ? "浅色" : "自动"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px]">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={cn("gap-2 cursor-pointer", theme === "light" && "bg-primary/10")}
        >
          <Sun className="h-4 w-4" />
          {t("common.light")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={cn("gap-2 cursor-pointer", theme === "dark" && "bg-primary/10")}
        >
          <Moon className="h-4 w-4" />
          {t("common.dark")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={cn("gap-2 cursor-pointer", theme === "system" && "bg-primary/10")}
        >
          <Monitor className="h-4 w-4" />
          {t("common.system")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

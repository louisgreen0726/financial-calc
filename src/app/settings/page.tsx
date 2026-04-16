"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/lib/i18n";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor, Globe, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { HISTORY_KEY } from "@/lib/constants";
import { safeGetItem, safeRemoveItem } from "@/lib/storage";

export default function SettingsPage() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();

  const handleClearHistory = () => {
    if (window.confirm(t("history.confirmClear") || "Clear all calculation history?")) {
      safeRemoveItem(HISTORY_KEY);
      toast.success(t("history.cleared") || "History cleared");
    }
  };

  const handleExportHistory = () => {
    const history = safeGetItem(HISTORY_KEY);
    if (!history) {
      toast.error(t("export.noData") || "No data to export");
      return;
    }
    const blob = new Blob([history], { type: "application/json" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "calculation-history.json");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(t("export.jsonSuccess") || "History exported");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("settings.title") || "Settings"}</h1>
        <p className="text-muted-foreground mt-2">{t("settings.customizeExperience")}</p>
      </div>

      {/* Appearance */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            {t("settings.appearance")}
          </CardTitle>
          <CardDescription>{t("settings.appearanceDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>{t("settings.theme")}</Label>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("light")}
                className={cn("gap-2", theme === "light" && "bg-primary")}
              >
                <Sun className="h-4 w-4" />
                {t("settings.light")}
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("dark")}
                className={cn("gap-2", theme === "dark" && "bg-primary")}
              >
                <Moon className="h-4 w-4" />
                {t("settings.dark")}
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("system")}
                className={cn("gap-2", theme === "system" && "bg-primary")}
              >
                <Monitor className="h-4 w-4" />
                {t("settings.system")}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>{t("settings.language")}</Label>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={language === "en" ? "default" : "outline"}
                size="sm"
                onClick={() => setLanguage("en")}
                className={cn("gap-2", language === "en" && "bg-primary")}
              >
                <Globe className="h-4 w-4" />
                English
              </Button>
              <Button
                variant={language === "zh" ? "default" : "outline"}
                size="sm"
                onClick={() => setLanguage("zh")}
                className={cn("gap-2", language === "zh" && "bg-primary")}
              >
                <Globe className="h-4 w-4" />
                中文
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t("settings.dataManagement")}
          </CardTitle>
          <CardDescription>{t("settings.dataManagementDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleExportHistory} className="gap-2">
              <Download className="h-4 w-4" />
              {t("settings.exportHistoryJson")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearHistory}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              {t("settings.clearAllHistory")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>{t("settings.about")}</CardTitle>
          <CardDescription>{t("settings.aboutDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>FinCalc Pro</strong> - {t("settings.title")}
          </p>
          <p>{t("settings.version")}</p>
          <p>{t("settings.description")}</p>
        </CardContent>
      </Card>
    </div>
  );
}

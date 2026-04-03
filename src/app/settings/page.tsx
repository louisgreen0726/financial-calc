"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/lib/i18n";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor, Globe, Trash2, Download, Calculator } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { HISTORY_KEY } from "@/lib/constants";

export default function SettingsPage() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [autoCalculate, setAutoCalculate] = useState(true);

  const handleClearHistory = () => {
    if (window.confirm(t("history.confirmClear") || "Clear all calculation history?")) {
      localStorage.removeItem(HISTORY_KEY);
      toast.success(t("history.cleared") || "History cleared");
    }
  };

  const handleExportHistory = () => {
    const history = localStorage.getItem(HISTORY_KEY);
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
        <h1 className="text-3xl font-bold tracking-tight">{t("settings.title") || "Settings"}</h1>
        <p className="text-muted-foreground mt-2">Customize your experience</p>
      </div>

      {/* Appearance */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            Appearance
          </CardTitle>
          <CardDescription>Customize how the app looks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Theme</Label>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("light")}
                className={cn("gap-2", theme === "light" && "bg-primary")}
              >
                <Sun className="h-4 w-4" />
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("dark")}
                className={cn("gap-2", theme === "dark" && "bg-primary")}
              >
                <Moon className="h-4 w-4" />
                Dark
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("system")}
                className={cn("gap-2", theme === "system" && "bg-primary")}
              >
                <Monitor className="h-4 w-4" />
                System
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Language / 语言</Label>
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

      {/* Behavior */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Behavior
          </CardTitle>
          <CardDescription>Customize how calculations work</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-calculate</Label>
              <p className="text-sm text-muted-foreground">Automatically recalculate results when inputs change</p>
            </div>
            <Switch checked={autoCalculate} onCheckedChange={setAutoCalculate} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notifications</Label>
              <p className="text-sm text-muted-foreground">Show toast notifications for actions</p>
            </div>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>Manage your calculation history and data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleExportHistory} className="gap-2">
              <Download className="h-4 w-4" />
              Export History (JSON)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearHistory}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Clear All History
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>About</CardTitle>
          <CardDescription>About FinCalc Pro</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>FinCalc Pro</strong> - Professional Financial Calculator
          </p>
          <p>Version 2.0.0</p>
          <p>
            A comprehensive suite of financial calculators including TVM, cash flow analysis, stock valuation, portfolio
            optimization, bonds, options, risk metrics, loans, and macroeconomics.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

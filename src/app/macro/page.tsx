"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";
import { Globe } from "lucide-react";

export default function MacroPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("macro.title")}</h1>
        <p className="text-muted-foreground mt-2">{t("macro.subtitle")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              {t("macro.construction")}
            </CardTitle>
            <CardDescription>{t("macro.constructionDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t("macro.comingSoon")}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, Calculator, BookOpen, Mail, ExternalLink, ChevronRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const FAQ_KEYS = [
  { q: "help.faqHistory", a: "help.faqHistoryAns" },
  { q: "help.faqExport", a: "help.faqExportAns" },
  { q: "help.faqTheme", a: "help.faqThemeAns" },
  { q: "help.faqLanguage", a: "help.faqLanguageAns" },
  { q: "help.faqMobile", a: "help.faqMobileAns" },
  { q: "help.faqPrivacy", a: "help.faqPrivacyAns" },
];

export default function HelpPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
          <HelpCircle className="h-8 w-8" />
          {t("help.title")}
        </h1>
        <p className="text-muted-foreground mt-2">{t("help.learnMore")}</p>
      </div>

      {/* Quick Start */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t("help.quickStart")}
          </CardTitle>
          <CardDescription>{t("help.quickStartDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary font-bold shrink-0">1</div>
              <div>
                <h4 className="font-semibold">{t("help.step1Title")}</h4>
                <p className="text-sm text-muted-foreground">{t("help.step1Desc")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary font-bold shrink-0">2</div>
              <div>
                <h4 className="font-semibold">{t("help.step2Title")}</h4>
                <p className="text-sm text-muted-foreground">{t("help.step2Desc")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary font-bold shrink-0">3</div>
              <div>
                <h4 className="font-semibold">{t("help.step3Title")}</h4>
                <p className="text-sm text-muted-foreground">{t("help.step3Desc")}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculators Overview */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {t("help.availableCalculators")}
          </CardTitle>
          <CardDescription>{t("help.calculatorsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg border bg-card">
              <h4 className="font-semibold">{t("help.tvmCalc")}</h4>
              <p className="text-sm text-muted-foreground mt-1">{t("help.tvmCalcDesc")}</p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <h4 className="font-semibold">{t("help.cashFlowCalc")}</h4>
              <p className="text-sm text-muted-foreground mt-1">{t("help.cashFlowCalcDesc")}</p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <h4 className="font-semibold">{t("help.stockVal")}</h4>
              <p className="text-sm text-muted-foreground mt-1">{t("help.stockValDesc")}</p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <h4 className="font-semibold">{t("help.portfolioOpt")}</h4>
              <p className="text-sm text-muted-foreground mt-1">{t("help.portfolioOptDesc")}</p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <h4 className="font-semibold">{t("help.bondsCalc")}</h4>
              <p className="text-sm text-muted-foreground mt-1">{t("help.bondsCalcDesc")}</p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <h4 className="font-semibold">{t("help.optionsCalc")}</h4>
              <p className="text-sm text-muted-foreground mt-1">{t("help.optionsCalcDesc")}</p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <h4 className="font-semibold">{t("help.riskMetrics")}</h4>
              <p className="text-sm text-muted-foreground mt-1">{t("help.riskMetricsDesc")}</p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <h4 className="font-semibold">{t("help.loanCalc")}</h4>
              <p className="text-sm text-muted-foreground mt-1">{t("help.loanCalcDesc")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>{t("help.faq")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {FAQ_KEYS.map((faq, i) => (
              <div key={i} className="p-4 rounded-lg border bg-card">
                <h4 className="font-semibold flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  {t(faq.q)}
                </h4>
                <p className="text-sm text-muted-foreground mt-2 ml-6">{t(faq.a)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t("help.contactSupport")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("help.contactDesc")}</p>
          <a
            href="https://github.com/louisgreen0726/financial-calc"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            {t("help.github")}
          </a>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, Calculator, BookOpen, Mail, ExternalLink, ChevronRight, BookOpenCheck } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { getModelGuide } from "@/lib/model-guide";

const FAQ_KEYS = [
  { q: "help.faqHistory", a: "help.faqHistoryAns" },
  { q: "help.faqExport", a: "help.faqExportAns" },
  { q: "help.faqTheme", a: "help.faqThemeAns" },
  { q: "help.faqLanguage", a: "help.faqLanguageAns" },
  { q: "help.faqMobile", a: "help.faqMobileAns" },
  { q: "help.faqPrivacy", a: "help.faqPrivacyAns" },
];

export default function HelpPage() {
  const { t, language } = useLanguage();
  const modelGuide = getModelGuide(language);

  return (
    <div className="page-stack max-w-4xl" data-tone="neutral">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <HelpCircle className="h-7 w-7 text-primary" />
            {t("help.title")}
          </h1>
          <p className="page-description">{t("help.learnMore")}</p>
        </div>
      </div>

      {/* Quick Start */}
      <Card>
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
                <h3 className="font-semibold">{t("help.step1Title")}</h3>
                <p className="text-sm text-muted-foreground">{t("help.step1Desc")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary font-bold shrink-0">2</div>
              <div>
                <h3 className="font-semibold">{t("help.step2Title")}</h3>
                <p className="text-sm text-muted-foreground">{t("help.step2Desc")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary font-bold shrink-0">3</div>
              <div>
                <h3 className="font-semibold">{t("help.step3Title")}</h3>
                <p className="text-sm text-muted-foreground">{t("help.step3Desc")}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculators Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {t("help.availableCalculators")}
          </CardTitle>
          <CardDescription>{t("help.calculatorsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid border-y md:grid-cols-2 md:[&>*:nth-child(odd)]:border-r">
            <div className="border-b p-4">
              <h3 className="font-semibold">{t("help.tvmCalc")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("help.tvmCalcDesc")}</p>
            </div>
            <div className="border-b p-4">
              <h3 className="font-semibold">{t("help.cashFlowCalc")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("help.cashFlowCalcDesc")}</p>
            </div>
            <div className="border-b p-4">
              <h3 className="font-semibold">{t("help.stockVal")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("help.stockValDesc")}</p>
            </div>
            <div className="border-b p-4">
              <h3 className="font-semibold">{t("help.portfolioOpt")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("help.portfolioOptDesc")}</p>
            </div>
            <div className="border-b p-4">
              <h3 className="font-semibold">{t("help.bondsCalc")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("help.bondsCalcDesc")}</p>
            </div>
            <div className="border-b p-4">
              <h3 className="font-semibold">{t("help.optionsCalc")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("help.optionsCalcDesc")}</p>
            </div>
            <div className="p-4 max-md:border-b">
              <h3 className="font-semibold">{t("help.riskMetrics")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("help.riskMetricsDesc")}</p>
            </div>
            <div className="p-4">
              <h3 className="font-semibold">{t("help.loanCalc")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("help.loanCalcDesc")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpenCheck className="h-5 w-5" />
            {modelGuide.title}
          </CardTitle>
          <CardDescription>{modelGuide.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <aside className="border-primary/25 bg-primary/5 border-l-4 px-4 py-3">
            <h3 className="font-semibold">{modelGuide.decisionNoticeTitle}</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{modelGuide.decisionNotice}</p>
          </aside>

          <div className="divide-y border-y">
            {modelGuide.sections.map((section) => (
              <article key={section.title} className="py-5 first:pt-4 last:pb-4">
                <h3 className="text-base font-semibold">{section.title}</h3>
                <div className="mt-4 grid gap-5 md:grid-cols-2">
                  <section aria-label={`${section.title}: ${modelGuide.assumptions}`}>
                    <h4 className="text-sm font-semibold">{modelGuide.assumptions}</h4>
                    <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
                      {section.assumptions.map((assumption) => (
                        <li key={assumption}>{assumption}</li>
                      ))}
                    </ul>
                  </section>
                  <section aria-label={`${section.title}: ${modelGuide.limitations}`}>
                    <h4 className="text-sm font-semibold">{modelGuide.limitations}</h4>
                    <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
                      {section.limitations.map((limitation) => (
                        <li key={limitation}>{limitation}</li>
                      ))}
                    </ul>
                  </section>
                </div>
                <div className="mt-4 border-l-2 border-border bg-muted/35 px-4 py-3">
                  <h4 className="text-sm font-semibold">{modelGuide.workedExample}</h4>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{section.example}</p>
                </div>
              </article>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>{t("help.faq")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y border-y">
            {FAQ_KEYS.map((faq, i) => (
              <div key={i} className="py-4">
                <h3 className="flex items-center gap-2 font-semibold">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  {t(faq.q)}
                </h3>
                <p className="ml-6 mt-2 text-sm leading-6 text-muted-foreground">{t(faq.a)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
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

"use client";

import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { NAV_CONFIG } from "@/lib/nav-config";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent w-fit">
          {t('home.title')}
        </h1>
        <p className="text-xl text-muted-foreground">
          {t('home.subtitle')}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {NAV_CONFIG.flatMap(section => section.items).map((item) => (
          <Link key={item.href} href={item.href} className="group">
            <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md hover:bg-muted/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <item.icon className="h-5 w-5" />
                  </div>
                  {t(item.titleKey)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription className="text-sm">
                  {t(item.descKey)}
                </CardDescription>
                <div className="flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                  {t('home.openModule')} <ArrowRight className="ml-1 h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}


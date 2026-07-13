"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n";
import { NAV_CONFIG } from "@/lib/nav-config";

export const CalculatorFinder = React.memo(function CalculatorFinder() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const sections = useMemo(() => {
    const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return NAV_CONFIG;

    return NAV_CONFIG.map((section) => {
      const sectionLabel = t(section.titleKey);
      const items = section.items.filter((item) => {
        const searchText = `${sectionLabel} ${t(item.titleKey)} ${t(item.descKey)}`.toLowerCase();
        return terms.every((term) => searchText.includes(term));
      });

      return { ...section, items };
    }).filter((section) => section.items.length > 0);
  }, [query, t]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setQuery("");
  };

  const closeFinder = () => handleOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="rounded-md hover:bg-muted"
          aria-label={t("sidebar.search")}
          title={t("sidebar.search")}
        >
          <Search aria-hidden="true" className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent
        closeLabel={t("common.close")}
        className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_auto_minmax(0,1fr)] gap-3 p-4 sm:max-w-2xl sm:p-5"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          searchInputRef.current?.focus();
        }}
      >
        <DialogHeader className="pr-8">
          <DialogTitle>{t("sidebar.search")}</DialogTitle>
          <DialogDescription className="sr-only">{t("sidebar.mobileDescription")}</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            ref={searchInputRef}
            type="search"
            name="calculator-finder-search"
            autoComplete="off"
            aria-label={t("sidebar.search")}
            placeholder={t("sidebar.search")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
          />
        </div>

        <div className="min-h-0 overflow-y-auto pr-1">
          {sections.length > 0 ? (
            <div className="space-y-4">
              {sections.map((section) => (
                <section key={section.titleKey} className="space-y-1" data-tone={section.tone}>
                  <h3 className="px-2 text-xs font-semibold text-muted-foreground">{t(section.titleKey)}</h3>
                  <ul className="space-y-0.5">
                    {section.items.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          prefetch={false}
                          onClick={closeFinder}
                          className="group flex min-w-0 items-center gap-3 rounded-md px-2 py-2 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50"
                        >
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:text-foreground">
                            <item.icon aria-hidden="true" className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium text-foreground">{t(item.titleKey)}</span>
                            <span className="block text-xs leading-5 text-muted-foreground">{t(item.descKey)}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <p role="status" className="py-10 text-center text-sm text-muted-foreground">
              {t("history.noResults")}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});

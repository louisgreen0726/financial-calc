"use client";

import React from "react";

import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./sidebar";
import { Menu } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/lib/i18n";

export const MobileSidebar = React.memo(function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t("common.toggleMenu")}>
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        closeLabel={t("common.close")}
        data-pdf-exclude="true"
        className="no-print flex w-[86vw] max-w-72 flex-col border-r bg-card p-0"
      >
        <SheetTitle className="sr-only">{t("common.toggleMenu")}</SheetTitle>
        <SheetDescription className="sr-only">{t("sidebar.search")}</SheetDescription>
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <Sidebar
            className="border-none w-full h-full bg-transparent"
            searchId="mobile-calculator-search"
            onNavigate={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
});

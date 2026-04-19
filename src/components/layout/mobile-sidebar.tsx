"use client";

import React from "react";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
        <Button variant="ghost" className="lg:hidden pr-3 hover:bg-transparent" aria-label={t("common.toggleMenu")}>
          <Menu className="w-6 h-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-[86vw] max-w-[320px] bg-background border-r flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <Sidebar className="border-none w-full h-full bg-transparent" />
        </div>
      </SheetContent>
    </Sheet>
  );
});

"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/lib/i18n";
import { SIDEBAR_COLLAPSED_KEY, SIDEBAR_PREFERENCE_CHANGED_EVENT } from "@/lib/constants";
import { safeGetItem, safeRemoveOrReplaceItem, safeSetJSON } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface AppLayoutProps {
  children: React.ReactNode;
}

interface SidebarPreferenceSnapshot {
  collapsed: boolean;
  needsRepair: boolean;
}

function parseSidebarPreference(value: string | null): SidebarPreferenceSnapshot {
  if (value === null) return { collapsed: false, needsRepair: false };

  try {
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === "boolean"
      ? { collapsed: parsed, needsRepair: false }
      : { collapsed: false, needsRepair: true };
  } catch {
    return { collapsed: false, needsRepair: true };
  }
}

function readSidebarPreference() {
  return parseSidebarPreference(safeGetItem(SIDEBAR_COLLAPSED_KEY));
}

function repairInvalidSidebarPreference() {
  if (readSidebarPreference().needsRepair) {
    safeRemoveOrReplaceItem(SIDEBAR_COLLAPSED_KEY, "false");
  }
}

function subscribeToSidebarPreference(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === SIDEBAR_COLLAPSED_KEY) {
      repairInvalidSidebarPreference();
      onStoreChange();
    }
  };
  const handlePreferenceChanged = () => {
    repairInvalidSidebarPreference();
    onStoreChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(SIDEBAR_PREFERENCE_CHANGED_EVENT, handlePreferenceChanged);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(SIDEBAR_PREFERENCE_CHANGED_EVENT, handlePreferenceChanged);
  };
}

function getSidebarPreference() {
  return readSidebarPreference().collapsed;
}

function getServerSidebarPreference() {
  return false;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { t } = useLanguage();
  const persistedSidebarCollapsed = useSyncExternalStore(
    subscribeToSidebarPreference,
    getSidebarPreference,
    getServerSidebarPreference
  );
  const [sessionSidebarCollapsed, setSessionSidebarCollapsed] = useState<boolean | null>(null);
  const sidebarCollapsed = sessionSidebarCollapsed ?? persistedSidebarCollapsed;

  useEffect(() => {
    repairInvalidSidebarPreference();
    const clearSessionPreference = () => setSessionSidebarCollapsed(null);
    const handleStorage = (event: StorageEvent) => {
      if (event.key === SIDEBAR_COLLAPSED_KEY) clearSessionPreference();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(SIDEBAR_PREFERENCE_CHANGED_EVENT, clearSessionPreference);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(SIDEBAR_PREFERENCE_CHANGED_EVENT, clearSessionPreference);
    };
  }, []);

  const setSidebarCollapsed = useCallback(
    (collapsed: boolean) => {
      if (!safeSetJSON(SIDEBAR_COLLAPSED_KEY, collapsed)) {
        setSessionSidebarCollapsed(collapsed);
        toast.error(t("common.changeNotPersisted"));
        return;
      }

      window.dispatchEvent(new Event(SIDEBAR_PREFERENCE_CHANGED_EVENT));
    },
    [t]
  );

  return (
    <div className="app-shell relative flex min-h-dvh overflow-x-clip selection:bg-primary/20">
      {/* Skip to Content Link */}
      <a
        href="#main-content"
        data-pdf-exclude="true"
        className="no-print sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[100] bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium shadow-lg"
      >
        {t("common.skipToContent")}
      </a>

      <aside
        aria-label="FinCalc Pro"
        data-pdf-exclude="true"
        data-collapsed={sidebarCollapsed}
        className={cn(
          "app-sidebar-frame no-print fixed inset-y-0 left-0 z-[80] hidden flex-col overflow-visible border-r bg-card transition-[width] duration-200 ease-out lg:flex",
          sidebarCollapsed ? "w-[4.5rem]" : "w-[17rem]"
        )}
      >
        <Sidebar collapsed={sidebarCollapsed} />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="sidebar-boundary-toggle absolute right-[-16px] top-4 z-20 size-8 rounded-md"
              aria-label={t(sidebarCollapsed ? "common.expandSidebar" : "common.collapseSidebar")}
              aria-pressed={sidebarCollapsed}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={10}>
            {t(sidebarCollapsed ? "common.expandSidebar" : "common.collapseSidebar")}
          </TooltipContent>
        </Tooltip>
      </aside>

      {/* Main Content Area */}
      <div
        data-app-content="true"
        className={cn(
          "relative z-10 flex min-h-dvh min-w-0 flex-1 flex-col transition-[padding-left] duration-200 ease-out",
          sidebarCollapsed ? "lg:pl-[4.5rem]" : "lg:pl-[17rem]"
        )}
      >
        <div data-pdf-exclude="true" className="no-print sticky top-0 z-50">
          <Header className="static" />
        </div>
        <main
          id="main-content"
          data-print-content="true"
          className="workspace-content mx-auto w-full max-w-[1440px] min-w-0 flex-1 px-4 pb-24 pt-6 sm:px-5 md:px-6 md:pb-20 lg:px-8 lg:pb-10 lg:pt-8"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <div data-pdf-exclude="true" className="no-print lg:hidden z-[90]">
        <MobileNav />
      </div>
    </div>
  );
}

"use client";

import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

interface ResponsiveDisclosureProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  defaultOpen?: boolean;
}

export function ResponsiveDisclosure({
  title,
  description,
  children,
  className,
  contentClassName,
  defaultOpen = false,
}: ResponsiveDisclosureProps) {
  return (
    <>
      <div className={cn("hidden lg:block", className)}>{children}</div>
      <details
        className={cn(
          "lg:hidden overflow-hidden rounded-3xl border border-white/10 bg-card/70 shadow-sm group",
          className
        )}
        open={defaultOpen}
      >
        <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-4 py-4 marker:hidden">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            {description ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p> : null}
          </div>
          <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <div className={cn("border-t border-white/10 px-3 pb-3 pt-2", contentClassName)}>{children}</div>
      </details>
    </>
  );
}

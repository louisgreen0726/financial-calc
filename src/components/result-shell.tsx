import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChartNoAxesCombined, type LucideIcon } from "lucide-react";

interface ResultShellProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  summary?: React.ReactNode;
  details?: React.ReactNode;
  advanced?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  isReady: boolean;
  className?: string;
}

export function ResultShell({
  title,
  description,
  actions,
  summary,
  details,
  advanced,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  isReady,
  className,
}: ResultShellProps) {
  return (
    <section className={cn("result-shell space-y-5", className)}>
      <div
        className="result-shell-heading flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-end sm:justify-between"
        data-pdf-block
      >
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{title}</h2>
          {description ? <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>

      {!isReady ? (
        <Card variant="subtle" className="border-dashed">
          <CardContent className="pt-6">
            <EmptyState
              icon={emptyIcon ?? ChartNoAxesCombined}
              title={emptyTitle ?? title}
              description={emptyDescription ?? description}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {summary ? (
            <div className="result-summary" role="status" aria-live="polite" aria-atomic="true" data-result-status>
              {summary}
            </div>
          ) : null}
          {details}
          {advanced}
        </>
      )}
    </section>
  );
}

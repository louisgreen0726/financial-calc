import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

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
    <section className={cn("space-y-6", className)}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>

      {!isReady ? (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            {emptyIcon ? (
              <EmptyState icon={emptyIcon} title={emptyTitle ?? title} description={emptyDescription ?? description} />
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-8">
                <h3 className="text-sm font-medium text-muted-foreground">{emptyTitle ?? title}</h3>
                {emptyDescription ? (
                  <p className="mt-2 text-sm text-muted-foreground/80 max-w-sm">{emptyDescription}</p>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {summary}
          {details}
          {advanced}
        </>
      )}
    </section>
  );
}

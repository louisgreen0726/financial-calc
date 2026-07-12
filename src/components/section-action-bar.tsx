import { cn } from "@/lib/utils";

interface SectionActionBarProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function SectionActionBar({ title, description, actions, className }: SectionActionBarProps) {
  return (
    <div
      className={cn("flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-end sm:justify-between", className)}
      data-pdf-block
    >
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description ? <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

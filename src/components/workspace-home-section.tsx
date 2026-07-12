import { cn } from "@/lib/utils";

interface WorkspaceHomeSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function WorkspaceHomeSection({ title, description, children, className }: WorkspaceHomeSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="workspace-section-heading">
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

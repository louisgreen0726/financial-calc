import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface WorkspaceHomeSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function WorkspaceHomeSection({ title, description, children, className }: WorkspaceHomeSectionProps) {
  return (
    <Card className={cn("rounded-2xl", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

import * as React from "react";

import { cn } from "@/lib/utils";

type CardVariant = "default" | "subtle" | "result" | "interactive";

const defaultSurface =
  "border-border/70 bg-card/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_1px_2px_rgba(15,23,42,0.05),0_14px_36px_-26px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-card/85 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_1px_2px_rgba(0,0,0,0.24),0_12px_30px_-22px_rgba(0,0,0,0.65)]";

const cardVariants: Record<CardVariant, string> = {
  default: defaultSurface,
  subtle:
    "!border-border/55 !bg-muted/30 !shadow-[inset_0_1px_0_rgba(255,255,255,0.42),0_1px_2px_rgba(15,23,42,0.035)] dark:!border-white/8 dark:!bg-muted/20 dark:!shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]",
  result:
    "!border-primary/20 !bg-card/90 !shadow-[inset_0_1px_0_rgba(255,255,255,0.62),0_2px_4px_rgba(15,23,42,0.055),0_18px_42px_-28px_hsl(var(--primary)/0.28)] dark:!border-primary/22 dark:!bg-card/88 dark:!shadow-[inset_0_1px_0_rgba(255,255,255,0.045),0_2px_4px_rgba(0,0,0,0.28),0_16px_38px_-26px_hsl(var(--primary)/0.3)]",
  interactive: `${defaultSurface} transition-[border-color,background-color,box-shadow] duration-200 hover:!border-primary/25 hover:!bg-card hover:!shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_2px_5px_rgba(15,23,42,0.06),0_18px_42px_-26px_rgba(15,23,42,0.3)] dark:hover:!border-primary/25 dark:hover:!bg-card dark:hover:!shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_2px_5px_rgba(0,0,0,0.3),0_18px_42px_-26px_rgba(0,0,0,0.72)]`,
};

type CardProps = React.ComponentProps<"div"> & {
  variant?: CardVariant;
};

function Card({ className, variant = "default", ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      data-variant={variant}
      className={cn(
        "app-card flex flex-col gap-5 rounded-lg border py-5 text-card-foreground backdrop-blur-xl",
        cardVariants[variant],
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-4 sm:px-5 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-5",
        className
      )}
      {...props}
    />
  );
}

type CardTitleProps = React.ComponentPropsWithoutRef<"h2"> & {
  as?: "h2" | "h3" | "h4";
};

function CardTitle({ className, as: Comp = "h2", ...props }: CardTitleProps) {
  return <Comp data-slot="card-title" className={cn("text-base font-semibold leading-snug", className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-description" className={cn("text-muted-foreground text-sm", className)} {...props} />;
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("px-4 sm:px-5", className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-4 sm:px-5 [.border-t]:pt-5", className)}
      {...props}
    />
  );
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
export type { CardProps, CardVariant };

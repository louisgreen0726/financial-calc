"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface CalculatorLayoutProps {
  title: string;
  subtitle: string;
  icon?: ReactNode;
  inputCard: {
    title: string;
    description?: string;
    children: ReactNode;
  };
  resultCard: {
    children: ReactNode;
    className?: string;
  };
  extraCards?: ReactNode;
}

export function CalculatorLayout({ title, subtitle, icon, inputCard, resultCard, extraCards }: CalculatorLayoutProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-2">{subtitle}</p>
        </div>
        {icon}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">{inputCard.title}</CardTitle>
            {inputCard.description && <CardDescription>{inputCard.description}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-6">{inputCard.children}</CardContent>
        </Card>

        <Card
          className={cn(
            "bg-muted/30 border-dashed border-2 flex flex-col justify-center items-center p-8 text-center",
            resultCard.className
          )}
        >
          {resultCard.children}
        </Card>
      </div>

      {extraCards}
    </div>
  );
}

"use client";

import { AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { useLanguage } from "@/lib/i18n";

interface ErrorDisplayProps {
  message: string | null;
  onDismiss?: () => void;
  className?: string;
  variant?: "error" | "warning" | "info";
  id?: string;
}

export function ErrorDisplay({ message, onDismiss, className, variant = "error", id }: ErrorDisplayProps) {
  const { t } = useLanguage();

  if (!message) return null;

  const variantStyles = {
    error: "bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200",
    warning:
      "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200",
    info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200",
  };

  const iconColors = {
    error: "text-red-500",
    warning: "text-yellow-500",
    info: "text-blue-500",
  };

  return (
    <div
      id={id}
      className={cn("flex items-start gap-3 p-4 rounded-lg border", variantStyles[variant], className)}
      role="alert"
    >
      <AlertCircle aria-hidden="true" className={cn("h-5 w-5 mt-0.5 flex-shrink-0", iconColors[variant])} />
      <div className="flex-1">
        <p className="text-sm font-medium">
          {variant === "error" && t("common.errorLabel")}
          {variant === "warning" && t("common.warningLabel")}
          {variant === "info" && t("common.infoLabel")}
        </p>
        <p className="text-sm mt-1">{message}</p>
      </div>
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 -mt-1 -mr-1 flex-shrink-0"
          onClick={onDismiss}
          aria-label={t("common.dismissMessage")}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

interface ValidationErrorProps {
  error: string | null;
  className?: string;
  id?: string;
}

export function ValidationError({ error, className, id }: ValidationErrorProps) {
  if (!error) return null;

  return (
    <p id={id} className={cn("text-sm text-destructive mt-1", className)} role="alert">
      {error}
    </p>
  );
}

interface InputErrorProps {
  error?: string;
  touched?: boolean;
  id?: string;
}

export function InputError({ error, touched, id }: InputErrorProps) {
  if (!error || !touched) return null;

  return (
    <p id={id} className="text-sm text-destructive mt-1" role="alert">
      {error}
    </p>
  );
}

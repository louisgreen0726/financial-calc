"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { logger } from "@/lib/logger";
import { useLanguage } from "@/lib/i18n";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

function ErrorFallback({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-[400px] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span className="min-w-0 break-words">{t("common.errorTitle")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 break-words text-sm text-muted-foreground">
            {error?.message || t("common.unexpectedError")}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="default" size="sm" onClick={onRetry}>
              {t("common.tryAgain")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              {t("common.refreshPage")}
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/" prefetch={false}>
                {t("common.home")}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onRetry={() => this.setState({ hasError: false, error: null })} />;
    }

    return this.props.children;
  }
}

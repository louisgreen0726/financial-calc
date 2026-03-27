"use client";

import { useState } from "react";
import { useCalculationHistory, CalculationHistoryItem } from "@/hooks/use-calculation-history";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Trash2, RotateCcw, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface HistoryPanelProps {
  page: string;
  onRestore?: (inputs: Record<string, number | string>) => void;
  className?: string;
}

export function HistoryPanel({ page, onRestore, className }: HistoryPanelProps) {
  const { t } = useLanguage();
  const { pageHistory, removeFromHistory, clearHistory, isInitialized } = useCalculationHistory({ page });
  const [isOpen, setIsOpen] = useState(false);

  const handleRestore = (item: CalculationHistoryItem) => {
    if (onRestore) {
      onRestore(item.inputs);
      toast.success(t("history.restored"));
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    clearHistory();
    toast.success(t("history.cleared"));
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatInputs = (inputs: Record<string, number | string>) => {
    return Object.entries(inputs)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
  };

  if (!isInitialized || pageHistory.length === 0) {
    return null;
  }

  return (
    <>
      {/* Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 gap-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Clock className="h-4 w-4" />
        {t("history.title")} ({pageHistory.length})
      </Button>

      {/* Panel */}
      {isOpen && (
        <Card className={`fixed bottom-16 right-4 z-50 w-96 shadow-lg ${className}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("history.title")}</CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleClear}
                title={t("history.clearAll")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {pageHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between p-2 rounded-lg border bg-card hover:bg-accent cursor-pointer group"
                    onClick={() => handleRestore(item)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{formatCurrency(item.result)}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(item.timestamp)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{formatInputs(item.inputs)}</p>
                      {item.label && <span className="text-xs text-primary">{item.label}</span>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestore(item);
                        }}
                        title={t("history.restore")}
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromHistory(item.id);
                        }}
                        title={t("history.delete")}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </>
  );
}

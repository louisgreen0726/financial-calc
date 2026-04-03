"use client";

import { useState } from "react";
import { useKeyboardShortcuts, KeyboardShortcut } from "@/hooks/use-keyboard-shortcuts";
import { useLanguage } from "@/lib/i18n";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsHelpProps {
  /** Controlled open state. When passed, the component acts as a controlled dialog. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function KeyboardShortcutsHelp({ open: controlledOpen, onOpenChange }: KeyboardShortcutsHelpProps = {}) {
  const { t } = useLanguage();
  const [internalOpen, setInternalOpen] = useState(false);

  // Support both controlled and uncontrolled usage
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = isControlled ? (onOpenChange ?? setInternalOpen) : setInternalOpen;

  const shortcuts: Record<string, KeyboardShortcut> = {
    CALCULATE: { key: "Enter", description: t("shortcuts.calculate") },
    CLEAR: { key: "Escape", description: t("shortcuts.clear") },
    COPY: { key: "c", ctrlKey: true, description: t("shortcuts.copy") },
    RESET: { key: "r", ctrlKey: true, description: t("shortcuts.reset") },
    HELP: { key: "?", description: t("shortcuts.help") },
    SAVE: { key: "s", ctrlKey: true, description: t("shortcuts.save") },
    EXPORT_CSV: { key: "e", ctrlKey: true, shiftKey: true, description: t("shortcuts.exportCsv") || "Export as CSV" },
    EXPORT_JSON: {
      key: "j",
      ctrlKey: true,
      shiftKey: true,
      description: t("shortcuts.exportJson") || "Export as JSON",
    },
    DARK_MODE: {
      key: "d",
      ctrlKey: true,
      shiftKey: true,
      description: t("shortcuts.toggleDarkMode") || "Toggle dark mode",
    },
    ZOOM_IN: { key: "+", ctrlKey: true, description: t("shortcuts.zoomIn") || "Zoom in" },
    ZOOM_OUT: { key: "-", ctrlKey: true, description: t("shortcuts.zoomOut") || "Zoom out" },
  };

  // Only register ? shortcut in uncontrolled mode (Header handles it in controlled mode)
  useKeyboardShortcuts({
    shortcuts: isControlled ? {} : { HELP: { key: "?", description: "Show help" } },
    onShortcut: () => setIsOpen(true),
  });

  const formatShortcut = (shortcut: KeyboardShortcut) => {
    const parts: string[] = [];
    if (shortcut.ctrlKey) parts.push("Ctrl");
    if (shortcut.altKey) parts.push("Alt");
    if (shortcut.shiftKey) parts.push("Shift");
    parts.push(shortcut.key.toUpperCase());
    return parts.join(" + ");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="fixed bottom-4 left-4 z-50">
            <Keyboard className="h-4 w-4" />
            <span className="sr-only">{t("shortcuts.title")}</span>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("shortcuts.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 text-left">{t("shortcuts.action")}</th>
                  <th className="px-4 py-2 text-right">{t("shortcuts.key")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {Object.entries(shortcuts).map(([action, shortcut]) => (
                  <tr key={action}>
                    <td className="px-4 py-2">{shortcut.description}</td>
                    <td className="px-4 py-2 text-right">
                      <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">{formatShortcut(shortcut)}</kbd>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">{t("shortcuts.note")}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

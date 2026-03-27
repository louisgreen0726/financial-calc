"use client";

import { useEffect, useCallback } from "react";

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  description: string;
}

export interface UseKeyboardShortcutsOptions {
  shortcuts: Record<string, KeyboardShortcut>;
  onShortcut: (action: string) => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({ shortcuts, onShortcut, enabled = true }: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        // Allow Escape and Ctrl+C even in inputs
        if (event.key !== "Escape" && !(event.ctrlKey && event.key === "c")) {
          return;
        }
      }

      for (const [action, shortcut] of Object.entries(shortcuts)) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = event.ctrlKey === (shortcut.ctrlKey ?? false);
        const altMatch = event.altKey === (shortcut.altKey ?? false);
        const shiftMatch = event.shiftKey === (shortcut.shiftKey ?? false);

        if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
          event.preventDefault();
          onShortcut(action);
          break;
        }
      }
    },
    [shortcuts, onShortcut, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, enabled]);
}

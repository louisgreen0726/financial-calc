"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { safeGetItem, safeSetItem } from "@/lib/storage";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme;
  systemTheme: ResolvedTheme;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  attribute?: "class";
  defaultTheme?: Theme;
  enableSystem?: boolean;
}

const THEME_STORAGE_KEY = "theme";
const THEME_CLASS_NAMES: ResolvedTheme[] = ["light", "dark"];
const MEDIA_QUERY = "(prefers-color-scheme: dark)";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function normalizeTheme(value: string | null, fallback: Theme): Theme {
  return value === "light" || value === "dark" || value === "system" ? value : fallback;
}

function applyTheme(resolvedTheme: ResolvedTheme) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.classList.remove(...THEME_CLASS_NAMES);
  root.classList.add(resolvedTheme);
  root.style.colorScheme = resolvedTheme;
}

export function ThemeProvider({ children, defaultTheme = "system", enableSystem = true }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>("light");
  const resolvedTheme = theme === "system" && enableSystem ? systemTheme : theme === "dark" ? "dark" : "light";

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const loadStoredTheme = () => {
      setThemeState(normalizeTheme(safeGetItem(THEME_STORAGE_KEY), defaultTheme));
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY) {
        setThemeState(normalizeTheme(event.newValue, defaultTheme));
      }
    };

    window.addEventListener("storage", handleStorage);

    if (typeof window.matchMedia !== "function") {
      queueMicrotask(loadStoredTheme);
      return () => window.removeEventListener("storage", handleStorage);
    }

    const mediaQuery = window.matchMedia(MEDIA_QUERY);
    const updateSystemTheme = () => setSystemTheme(mediaQuery.matches ? "dark" : "light");

    queueMicrotask(() => {
      loadStoredTheme();
      updateSystemTheme();
    });

    mediaQuery.addEventListener("change", updateSystemTheme);
    return () => {
      mediaQuery.removeEventListener("change", updateSystemTheme);
      window.removeEventListener("storage", handleStorage);
    };
  }, [defaultTheme]);

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme);
    safeSetItem(THEME_STORAGE_KEY, nextTheme);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      resolvedTheme,
      systemTheme,
    }),
    [resolvedTheme, setTheme, systemTheme, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}

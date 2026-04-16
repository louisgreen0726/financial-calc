"use client";

import { useSyncExternalStore } from "react";

interface ClientOnlyChartProps {
  children: React.ReactNode;
  fallbackClassName?: string;
}

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function ClientOnlyChart({ children, fallbackClassName = "h-full w-full" }: ClientOnlyChartProps) {
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!mounted) {
    return <div className={fallbackClassName} aria-hidden="true" />;
  }

  return <>{children}</>;
}

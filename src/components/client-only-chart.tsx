"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

interface ClientOnlyChartProps {
  children: ReactNode | ((size: { height: number; width: number }) => ReactNode);
  className?: string;
  fallbackClassName?: string;
  minHeight?: number;
  minWidth?: number;
}

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function ClientOnlyChart({
  children,
  className = "h-full w-full",
  fallbackClassName = "h-full w-full",
  minHeight = 8,
  minWidth = 8,
}: ClientOnlyChartProps) {
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    const element = containerRef.current;
    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      setSize((current) => {
        const next = { width: rect.width, height: rect.height };
        return current.width === next.width && current.height === next.height ? current : next;
      });
    };

    updateSize();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateSize);
      return () => window.removeEventListener("resize", updateSize);
    }

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [mounted]);

  const hasUsableSize = mounted && size.width >= minWidth && size.height >= minHeight;
  const chartSize = { width: Math.floor(size.width), height: Math.floor(size.height) };

  return (
    <div ref={containerRef} className={className}>
      {hasUsableSize ? (
        typeof children === "function" ? (
          children(chartSize)
        ) : (
          children
        )
      ) : (
        <div className={fallbackClassName} aria-hidden="true" />
      )}
    </div>
  );
}

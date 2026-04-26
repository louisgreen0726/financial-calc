"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, ReactNode } from "react";

interface VirtualTableProps<T> {
  data: T[];
  rowHeight?: number;
  renderRow: (item: T, index: number) => ReactNode;
  className?: string;
}

export function VirtualTable<T>({ data, rowHeight = 48, renderRow, className }: VirtualTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual exposes imperative helpers by design.
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 5,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div ref={parentRef} className={`overflow-auto ${className}`} style={{ height: "400px" }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualItems.map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderRow(data[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
}

import { describe, expect, it } from "vitest";

import { createCalculationHistoryEnvelope, MAX_HISTORY_IMPORT_ITEMS } from "@/lib/calculation-history";
import { CALCULATOR_PAGE_IDS } from "@/lib/constants";
import { serializeJson } from "@/lib/data-export";
import {
  createWorkspaceBackup,
  MAX_WORKSPACE_BACKUP_BYTES,
  MAX_WORKSPACE_BACKUP_FAVORITES,
  parseWorkspaceBackup,
  prepareWorkspaceBackupRestore,
  WORKSPACE_BACKUP_KIND,
  type WorkspaceBackupEnvelope,
  type WorkspacePreferences,
} from "@/lib/workspace-backup";

const now = 1_800_000_000_000;
const preferences: WorkspacePreferences = {
  language: "zh",
  theme: "dark",
  currency: "CNY",
  sidebarCollapsed: true,
};

function historyItem(id: string, timestamp = now, result = 100) {
  return {
    id,
    page: "tvm" as const,
    inputs: { rate: "5", target: "pv" },
    result,
    timestamp,
    resultFormat: "currency" as const,
  };
}

function validEnvelope(): WorkspaceBackupEnvelope {
  return {
    kind: WORKSPACE_BACKUP_KIND,
    version: 1,
    exportedAt: new Date(now).toISOString(),
    history: createCalculationHistoryEnvelope([historyItem("one")]),
    favorites: ["one"],
    preferences,
  };
}

describe("workspace backup", () => {
  it("creates a versioned normalized backup and removes orphaned favorites", () => {
    const backup = createWorkspaceBackup({
      history: [historyItem("one")],
      favorites: ["one", "missing", "one", 42],
      preferences,
      now,
    });

    expect(backup).toEqual({
      kind: WORKSPACE_BACKUP_KIND,
      version: 1,
      exportedAt: new Date(now).toISOString(),
      history: createCalculationHistoryEnvelope([historyItem("one")]),
      favorites: ["one"],
      preferences,
    });
  });

  it("strictly validates the outer contract and preference primitives", () => {
    const cases: Array<[string, (candidate: Record<string, unknown>) => void]> = [
      ["kind", (candidate) => (candidate.kind = "other")],
      ["timestamp", (candidate) => (candidate.exportedAt = "yesterday")],
      ["extra outer field", (candidate) => (candidate.extra = true)],
      ["language", (candidate) => ((candidate.preferences as Record<string, unknown>).language = "fr")],
      ["theme", (candidate) => ((candidate.preferences as Record<string, unknown>).theme = "sepia")],
      ["currency", (candidate) => ((candidate.preferences as Record<string, unknown>).currency = "BTC")],
      ["sidebar", (candidate) => ((candidate.preferences as Record<string, unknown>).sidebarCollapsed = "yes")],
      ["favorite id", (candidate) => (candidate.favorites = [""])],
    ];

    for (const [, mutate] of cases) {
      const candidate = structuredClone(validEnvelope()) as unknown as Record<string, unknown>;
      mutate(candidate);
      expect(parseWorkspaceBackup(candidate, { now })).toEqual({ ok: false, error: "invalid" });
    }
  });

  it("distinguishes unsupported versions, byte limits, and collection limits", () => {
    expect(parseWorkspaceBackup({ ...validEnvelope(), version: 2 }, { now })).toEqual({
      ok: false,
      error: "unsupported-version",
    });
    expect(parseWorkspaceBackup(validEnvelope(), { byteLength: MAX_WORKSPACE_BACKUP_BYTES + 1, now })).toEqual({
      ok: false,
      error: "too-large",
    });
    expect(parseWorkspaceBackup(validEnvelope(), { now: Number.NaN })).toEqual({ ok: false, error: "invalid" });
    expect(
      parseWorkspaceBackup(
        { ...validEnvelope(), favorites: Array.from({ length: MAX_WORKSPACE_BACKUP_FAVORITES + 1 }, (_, i) => `${i}`) },
        { now }
      )
    ).toEqual({ ok: false, error: "too-many-items" });
    expect(
      parseWorkspaceBackup(
        {
          ...validEnvelope(),
          history: createCalculationHistoryEnvelope(
            Array.from({ length: MAX_HISTORY_IMPORT_ITEMS + 1 }, (_, i) => historyItem(`${i}`))
          ),
        },
        { now }
      )
    ).toEqual({ ok: false, error: "too-many-items" });
  });

  it("accepts a near-limit compact backup that pretty printing would make too large", () => {
    const inputsPerItem = 100;
    const itemsPerPage = 50;
    const valueCount = CALCULATOR_PAGE_IDS.length * itemsPerPage * inputsPerItem;
    const buildBackup = (valueLength: number): WorkspaceBackupEnvelope => ({
      ...validEnvelope(),
      history: createCalculationHistoryEnvelope(
        CALCULATOR_PAGE_IDS.flatMap((page, pageIndex) =>
          Array.from({ length: itemsPerPage }, (_, itemIndex) => ({
            id: `${page}-${itemIndex}`,
            page,
            inputs: Object.fromEntries(
              Array.from({ length: inputsPerItem }, (_, inputIndex) => [`input${inputIndex}`, "x".repeat(valueLength)])
            ),
            result: pageIndex * itemsPerPage + itemIndex,
            timestamp: now - pageIndex * itemsPerPage - itemIndex,
            resultFormat: "number" as const,
          }))
        )
      ),
      favorites: [],
    });
    const compactBaseBytes = new TextEncoder().encode(serializeJson(buildBackup(0), 0)).byteLength;
    const valueLength = Math.floor((MAX_WORKSPACE_BACKUP_BYTES - compactBaseBytes) / valueCount);
    expect(valueLength).toBeGreaterThan(0);

    const backup = buildBackup(valueLength);
    const compactBytes = new TextEncoder().encode(serializeJson(backup, 0)).byteLength;
    const prettyBytes = new TextEncoder().encode(serializeJson(backup)).byteLength;

    expect(compactBytes).toBeLessThanOrEqual(MAX_WORKSPACE_BACKUP_BYTES);
    expect(MAX_WORKSPACE_BACKUP_BYTES - compactBytes).toBeLessThan(valueCount);
    expect(prettyBytes).toBeGreaterThan(MAX_WORKSPACE_BACKUP_BYTES);
    expect(parseWorkspaceBackup(backup, { byteLength: compactBytes, now }).ok).toBe(true);
    expect(parseWorkspaceBackup(backup, { byteLength: prettyBytes, now })).toEqual({
      ok: false,
      error: "too-large",
    });
  });

  it("reuses history normalization and filters favorites for skipped records", () => {
    const candidate = validEnvelope() as unknown as Record<string, unknown>;
    candidate.history = {
      version: 1,
      items: [historyItem("one"), { ...historyItem("invalid"), result: Number.POSITIVE_INFINITY }],
    };
    candidate.favorites = ["one", "invalid", "orphan"];

    const parsed = parseWorkspaceBackup(candidate, { now });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.backup.history.items.map((item) => item.id)).toEqual(["one"]);
    expect(parsed.value.backup.favorites).toEqual(["one"]);
    expect(parsed.value.historyNormalization.skipped).toBe(1);
  });

  it("merges history, unions favorites, and keeps favorites aligned to final history ids", () => {
    const source: WorkspaceBackupEnvelope = {
      ...validEnvelope(),
      history: createCalculationHistoryEnvelope([
        historyItem("updated", now - 1, 150),
        historyItem("imported", now - 2, 200),
      ]),
      favorites: ["updated", "imported"],
    };
    const parsed = parseWorkspaceBackup(source, { now });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const restore = prepareWorkspaceBackupRestore(
      parsed.value,
      [historyItem("updated", now - 3, 90), historyItem("retained", now - 4, 80)],
      ["retained", "orphan"],
      now
    );

    expect(restore.ok).toBe(true);
    if (!restore.ok) return;
    expect(restore.history.items.map((item) => item.id)).toEqual(["updated", "imported", "retained"]);
    expect(restore.history.items[0].result).toBe(150);
    expect(new Set(restore.favorites)).toEqual(new Set(["updated", "imported", "retained"]));
    expect(restore.summary).toMatchObject({ added: 1, updated: 1, favoritesAdded: 2, favoritesTotal: 3 });
    expect(restore.preferences).toEqual(preferences);
  });
});

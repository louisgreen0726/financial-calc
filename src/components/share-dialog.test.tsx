import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ShareDialog } from "@/components/share-dialog";
import { LanguageProvider } from "@/lib/i18n";
import { logger } from "@/lib/logger";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn() },
}));

function renderShareDialog(share: () => Promise<void>) {
  Object.defineProperty(navigator, "share", { configurable: true, value: vi.fn(share) });
  render(
    <LanguageProvider>
      <ShareDialog open onOpenChange={vi.fn()} title="Loan result" results={{ Payment: 100 }} />
    </LanguageProvider>
  );
}

describe("ShareDialog native share recovery", () => {
  afterEach(() => {
    vi.clearAllMocks();
    Reflect.deleteProperty(navigator, "share");
  });

  it("keeps user cancellation silent", async () => {
    renderShareDialog(() => Promise.reject(new DOMException("Cancelled", "AbortError")));

    fireEvent.click(screen.getByRole("button", { name: "Share Results" }));

    await waitFor(() => expect(navigator.share).toHaveBeenCalledOnce());
    expect(toast.error).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("explains permission failures and leaves copy alternatives available", async () => {
    const error = new DOMException("Permission denied", "NotAllowedError");
    renderShareDialog(() => Promise.reject(error));

    fireEvent.click(screen.getByRole("button", { name: "Share Results" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Unable to share. Try copying the link or text instead.")
    );
    expect(logger.error).toHaveBeenCalledWith("Native share error:", error);
    expect(screen.getByRole("button", { name: "Copy as plain text" })).toBeEnabled();
  });
});

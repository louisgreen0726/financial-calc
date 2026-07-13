import { afterEach, describe, expect, it, vi } from "vitest";

import { copyTextToClipboard } from "@/lib/clipboard";

function installModernClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(window, "isSecureContext", { configurable: true, value: true });
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: vi.fn(writeText) },
  });
}

describe("copyTextToClipboard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it("falls back to the legacy copy command after a permission rejection", async () => {
    const permissionError = new DOMException("Permission denied", "NotAllowedError");
    installModernClipboard(() => Promise.reject(permissionError));
    const execCommand = vi.fn(() => true);
    Object.defineProperty(document, "execCommand", { configurable: true, value: execCommand });
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    await expect(copyTextToClipboard("recoverable value")).resolves.toBeUndefined();

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("recoverable value");
    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(document.querySelector("textarea")).toBeNull();
    expect(document.activeElement).toBe(input);
  });

  it("reports both failures and always removes the temporary textarea", async () => {
    const permissionError = new DOMException("Permission denied", "NotAllowedError");
    installModernClipboard(() => Promise.reject(permissionError));
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: vi.fn(() => false),
    });

    const copyPromise = copyTextToClipboard("blocked value");

    await expect(copyPromise).rejects.toMatchObject({
      name: "AggregateError",
      message: "Clipboard copy failed",
      errors: [permissionError, expect.any(Error)],
    });
    expect(document.querySelector("textarea")).toBeNull();
  });
});

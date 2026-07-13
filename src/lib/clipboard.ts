export async function copyTextToClipboard(text: string): Promise<void> {
  let modernClipboardFailed = false;
  let modernClipboardError: unknown;

  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof window !== "undefined" &&
    window.isSecureContext
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (error) {
      modernClipboardFailed = true;
      modernClipboardError = error;
    }
  }

  if (typeof document === "undefined" || !document.body) {
    if (modernClipboardFailed) {
      throw modernClipboardError;
    }
    throw new Error("Clipboard copying is unavailable");
  }

  const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  textArea.style.top = "0";
  document.body.appendChild(textArea);

  try {
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    if (!successful) {
      throw new Error("Copy command failed");
    }
  } catch (legacyClipboardError) {
    if (modernClipboardFailed) {
      throw new AggregateError([modernClipboardError, legacyClipboardError], "Clipboard copy failed");
    }
    throw legacyClipboardError;
  } finally {
    textArea.remove();
    try {
      previouslyFocused?.focus({ preventScroll: true });
    } catch {
      // Focus restoration must not turn a successful copy into a reported failure.
    }
  }
}

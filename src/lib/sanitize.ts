export const MAX_SANITIZED_INPUT_LENGTH = 120;

const TEXT_WHITESPACE = /[\t\n\r]+/g;
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/g;

/**
 * Normalize plain-text input without converting user-visible characters into HTML entities.
 * @param input Raw user input string
 * @param maxLength Maximum number of Unicode code points to retain
 * @returns Normalized, single-line plain text
 */
export function sanitizeInput(input: string, maxLength = MAX_SANITIZED_INPUT_LENGTH): string {
  if (!input) return "";
  if (!Number.isFinite(maxLength) || maxLength <= 0) return "";

  const normalized = input.normalize("NFC").replace(TEXT_WHITESPACE, " ").replace(CONTROL_CHARACTERS, "");
  return Array.from(normalized).slice(0, Math.floor(maxLength)).join("");
}

/**
 * Escape HTML special characters for safe display (SSR-safe, no DOM dependency)
 * @param text Text to escape
 * @returns Escaped text
 */
export function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

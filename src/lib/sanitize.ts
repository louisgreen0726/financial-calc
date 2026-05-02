import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize user input to prevent XSS attacks
 * @param input Raw user input string
 * @returns Sanitized string safe for display
 */
export function sanitizeInput(input: string): string {
  if (!input) return "";
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true,
  });
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

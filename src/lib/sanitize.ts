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
 * Sanitize and validate numeric input
 * @param value Input string
 * @returns Object with sanitized value and validation result
 */
export function sanitizeNumericInput(value: string): {
  sanitized: string;
  isValid: boolean;
  numericValue?: number;
} {
  const sanitized = sanitizeInput(value).trim();

  // Remove any non-numeric characters except minus, decimal point, and comma
  const cleaned = sanitized.replace(/[^0-9.,\-]/g, "");

  const numericValue = parseFloat(cleaned);
  const isValid = !isNaN(numericValue) && isFinite(numericValue);

  return {
    sanitized: cleaned,
    isValid,
    numericValue: isValid ? numericValue : undefined,
  };
}

/**
 * Escape HTML special characters for safe display
 * @param text Text to escape
 * @returns Escaped text
 */
export function escapeHtml(text: string): string {
  if (!text) return "";

  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

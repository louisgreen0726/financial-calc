export interface A11yAuditResult {
  passes: number;
  violations: A11yViolation[];
  incomplete: unknown[];
}

interface A11yViolation {
  id: string;
  impact: "minor" | "moderate" | "serious" | "critical";
  tags: string[];
  description: string;
  help: string;
  helpUrl: string;
  nodes: A11yNode[];
}

interface A11yNode {
  target: string[];
  html: string;
  impact: string;
  failureSummary: string;
}

/**
 * Simple accessibility checks that can be run in the browser
 */
export function runBasicA11yChecks(): string[] {
  const issues: string[] = [];

  // Check for images without alt text
  const images = document.querySelectorAll("img:not([alt])");
  images.forEach((img) => {
    const imgElement = img as HTMLImageElement;
    issues.push(`Image missing alt text: ${imgElement.src}`);
  });

  // Check for form inputs without labels
  const inputs = document.querySelectorAll("input:not([aria-label]):not([aria-labelledby])");
  inputs.forEach((input) => {
    const id = input.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (!label) {
        issues.push(`Input missing label: ${id}`);
      }
    }
  });

  // Check for low contrast (basic check)
  const elements = document.querySelectorAll("p, span, div");
  elements.forEach((el) => {
    const style = window.getComputedStyle(el);
    const color = style.color;
    const bgColor = style.backgroundColor;

    // Check if text color is too similar to background
    if (color === bgColor && color !== "rgba(0, 0, 0, 0)") {
      issues.push(`Potential low contrast: ${el.tagName}`);
    }
  });

  // Check for missing language attribute
  const html = document.documentElement;
  if (!html.lang) {
    issues.push("HTML element missing lang attribute");
  }

  // Check for empty links
  const links = document.querySelectorAll("a");
  links.forEach((link) => {
    if (!link.textContent?.trim() && !link.getAttribute("aria-label")) {
      issues.push(`Empty link: ${link.href}`);
    }
  });

  // Check for missing page title
  if (!document.title) {
    issues.push("Page missing title");
  }

  return issues;
}

/**
 * Check if element is focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  const focusableElements = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
  ];

  return focusableElements.some((selector) => element.matches(selector));
}

/**
 * Get all focusable elements
 */
export function getFocusableElements(container: HTMLElement = document.body): HTMLElement[] {
  const selector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
  ].join(", ");

  return Array.from(container.querySelectorAll(selector));
}

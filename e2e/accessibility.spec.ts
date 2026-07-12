import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "playwright/test";

const routes = [
  "/",
  "/tvm/",
  "/cash-flow/",
  "/equity/",
  "/portfolio/",
  "/bonds/",
  "/options/",
  "/risk/",
  "/loans/",
  "/macro/",
  "/history/",
  "/settings/",
  "/help/",
] as const;

const axeTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa", "best-practice"];

async function expectNoAccessibilityViolations(page: Page, state: string) {
  const { violations } = await new AxeBuilder({ page }).withTags(axeTags).analyze();
  const summary = violations
    .map(
      (violation) =>
        `${violation.id} (${violation.impact ?? "unknown"}): ${violation.help}\n${violation.nodes
          .map((node) => `  ${node.target.join(" ")}: ${node.failureSummary ?? node.html}`)
          .join("\n")}`
    )
    .join("\n\n");

  expect(violations, `${state}\n${summary}`).toEqual([]);
}

for (const route of routes) {
  test(`${route} meets the automated accessibility baseline`, async ({ page }) => {
    await page.goto(route);
    await page.locator("main").waitFor();
    await expectNoAccessibilityViolations(page, route);
  });
}

test("option form errors, sharing, and history remain accessible", async ({ page }) => {
  await page.goto("/options/");
  await page.locator("#opt-spot").fill("");
  await expect(page.locator("#opt-spot-error")).toBeVisible();
  await expectNoAccessibilityViolations(page, "Options invalid form state");

  await page.locator("#opt-spot").fill("100");
  await page.getByRole("button", { name: "Share Results" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expectNoAccessibilityViolations(page, "Options share dialog");
  await page.keyboard.press("Escape");

  const historyButton = page.getByRole("button", { name: /^History \(\d+\)$/ });
  await expect(historyButton).toBeVisible();
  await historyButton.click();
  await expect(page.getByRole("dialog", { name: "History" })).toBeVisible();
  await expectNoAccessibilityViolations(page, "Options history panel");
});

test.describe("mobile accessibility", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("navigation and calculator controls meet the automated baseline", async ({ page }) => {
    await page.goto("/options/");
    await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
    await expectNoAccessibilityViolations(page, "Options mobile navigation and form");
  });
});

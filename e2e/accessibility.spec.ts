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
const largeDocumentAccessibilityTimeout = 60_000;

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
  test(`${route} meets the automated accessibility baseline`, async ({ page }, testInfo) => {
    // The complete 360-period loan table has about 2,400 accessible nodes and needs a larger Axe scan budget.
    if (route === "/loans/") testInfo.setTimeout(largeDocumentAccessibilityTimeout);

    await page.goto(route, { waitUntil: "networkidle" });
    await expect(page.locator("main")).toBeVisible();
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

test("history import preview remains accessible", async ({ page }) => {
  await page.goto("/settings/");
  await page.getByLabel("Choose a calculation history JSON file").setInputFiles({
    name: "calculation-history.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        version: 1,
        items: [
          {
            id: "accessibility-import",
            page: "tvm",
            inputs: { rate: "5" },
            result: 100,
            timestamp: Date.now(),
          },
        ],
      })
    ),
  });

  await expect(page.getByRole("dialog", { name: "Review history import" })).toBeVisible();
  await expectNoAccessibilityViolations(page, "History import preview dialog");
});

test.describe("mobile accessibility", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("navigation and calculator controls meet the automated baseline", async ({ page }) => {
    await page.goto("/options/");
    await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
    await expectNoAccessibilityViolations(page, "Options mobile navigation and form");
  });
});

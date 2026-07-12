import { expect, test } from "playwright/test";

test("previews, merges, and deduplicates imported calculation history", async ({ page }) => {
  const importedItem = {
    id: "e2e-imported-loan",
    page: "loans",
    inputs: { principal: "10000", annualRate: "5", termYears: "5" },
    result: 188.71,
    timestamp: Date.now(),
    label: "Imported monthly payment",
    resultFormat: "currency",
  };
  const validFile = {
    name: "calculation-history.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ version: 1, items: [importedItem] })),
  };

  await page.goto("/settings/");
  const fileInput = page.getByLabel("Choose a calculation history JSON file");
  await fileInput.setInputFiles(validFile);

  const preview = page.getByRole("dialog", { name: "Review history import" });
  await expect(preview).toContainText("1 new");
  await expect(preview).toContainText("0 duplicates");
  await expect(preview).toContainText("1 total after import");
  await preview.getByRole("button", { name: "Import history" }).click();
  await expect(page.getByText(/Calculation history imported/)).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("financial-calc-history") ?? "null")))
    .toEqual({ version: 1, items: [importedItem] });

  await fileInput.setInputFiles(validFile);
  await expect(page.getByText("This file contains no newer history records", { exact: true })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Review history import" })).toHaveCount(0);

  await fileInput.setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from("not json"),
  });
  await expect(
    page.getByText("The selected file is not a valid calculation history export", { exact: true })
  ).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("financial-calc-history") ?? "null"))).toEqual({
    version: 1,
    items: [importedItem],
  });
});

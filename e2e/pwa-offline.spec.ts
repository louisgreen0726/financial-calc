import { rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { expect, test, type Page } from "playwright/test";

const updateWorkerPath = path.resolve(process.cwd(), "out", "pwa-e2e-update-worker.js");
const offlineMarkerPath = path.resolve(process.cwd(), "out", ".pwa-e2e-offline");
const updateWorkerSource = `
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
`;

function collectBrowserErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  return errors;
}

test.beforeAll(async () => {
  await rm(offlineMarkerPath, { force: true });
  await writeFile(updateWorkerPath, updateWorkerSource, "utf8");
});

test.afterAll(async () => {
  await Promise.all([rm(updateWorkerPath, { force: true }), rm(offlineMarkerPath, { force: true })]);
});

test("installs, serves uncached routes offline, falls back to 404, and activates updates on request", async ({
  page,
}) => {
  const errors = collectBrowserErrors(page);
  await page.goto("/");

  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const registration = await navigator.serviceWorker.getRegistration("/");
          return {
            active: registration?.active?.state ?? null,
            controller: Boolean(navigator.serviceWorker.controller),
            installing: registration?.installing?.state ?? null,
            waiting: registration?.waiting?.state ?? null,
          };
        }),
      { timeout: 30_000 }
    )
    .toEqual({ active: "activated", controller: true, installing: null, waiting: null });

  const cacheState = await page.evaluate(async () => {
    const names = await caches.keys();
    const staticCacheName = names.find((name) => name.includes("-static-"));
    const requests = staticCacheName ? await (await caches.open(staticCacheName)).keys() : [];
    const registration = await navigator.serviceWorker.getRegistration("/");
    return {
      activeWorker: registration?.active?.scriptURL ?? "",
      controller: navigator.serviceWorker.controller?.scriptURL ?? "",
      names,
      paths: requests.map((request) => new URL(request.url).pathname),
    };
  });
  expect(cacheState.activeWorker).toContain("/sw.js");
  expect(cacheState.controller).toContain("/sw.js");
  expect(cacheState.names.some((name) => name.startsWith("financial-calc-") && name.includes("-static-"))).toBe(true);
  expect(cacheState.paths).toContain("/options/index.html");
  expect(cacheState.paths).toContain("/options/");
  expect(cacheState.paths).toContain("/404.html");

  await writeFile(offlineMarkerPath, "offline", "utf8");
  await page.goto("/options/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1, name: "Options Pricing" })).toBeVisible();
  await expect(page.locator("#opt-dividend-yield")).toHaveValue("0");

  const notFoundResponse = await page.goto("/not-a-real-calculator/", { waitUntil: "domcontentloaded" });
  expect(notFoundResponse?.status()).toBe(404);
  await expect(page.getByText("This page could not be found.", { exact: true })).toBeVisible();
  expect(errors).toEqual([expect.stringContaining("404")]);
  errors.length = 0;

  await rm(offlineMarkerPath, { force: true });
  await page.goto("/");
  await page.evaluate(() => sessionStorage.setItem("pwa-update-reload", "pending"));
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.register("/pwa-e2e-update-worker.js", { scope: "/" });
    await registration.update();
  });

  await expect(page.getByText("A new version is ready.", { exact: true })).toBeVisible();
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    page.getByRole("button", { name: "Refresh page" }).click(),
  ]);
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration("/");
        return registration?.active?.scriptURL ?? "";
      })
    )
    .toContain("/pwa-e2e-update-worker.js");
  expect(await page.evaluate(() => sessionStorage.getItem("pwa-update-reload"))).toBe("pending");
  expect(errors).toEqual([]);
});

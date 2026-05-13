import { expect, test } from "@playwright/test";
import { openTwoPeers } from "@baditaflorin/mesh-common/testing";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as {
  name: string;
};
const storagePrefix = pkg.name;

test("raise on peer A appears on peer B; all clear from B lowers it on A", async ({
  browser,
  baseURL,
}) => {
  const { a, b, cleanup } = await openTwoPeers(browser, baseURL ?? "", { storagePrefix });
  try {
    await a.getByPlaceholder("your name").fill("alice");
    await b.getByPlaceholder("your name").fill("bob");

    await a.getByRole("button", { name: "✋ raise hand", exact: true }).click();

    await expect(b.locator(".soh-entry")).toContainText(["alice"]);
    await expect(b.locator(".soh-status")).toContainText("1 hand up");

    await b.getByRole("button", { name: "all clear", exact: true }).click();

    await expect(a.getByRole("button", { name: "✋ raise hand", exact: true })).toBeVisible();
    await expect(a.locator(".soh-empty")).toBeVisible();
  } finally {
    await cleanup();
  }
});

test("name persists to localStorage across reload", async ({ page, baseURL }) => {
  await page.goto(baseURL ?? "");
  await page.getByPlaceholder("your name").fill("charlie");
  await page.reload();
  await expect(page.getByPlaceholder("your name")).toHaveValue("charlie");
});

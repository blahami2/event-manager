import { expect, test } from "@playwright/test";

for (const width of [320, 375]) {
  test(`real Czech admin components do not overflow at ${width}px`, async ({ context, page }) => {
    await context.addCookies([{ name: "NEXT_LOCALE", value: "cs", domain: "127.0.0.1", path: "/" }]);
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/e2e/admin-responsive");
    await page.getByRole("button", { name: "Otevřít nabídku administrace" }).click();

    await expect(page.getByRole("link", { name: "Registrace" }).last()).toBeVisible();
    await expect(page.getByRole("button", { name: "Přidat rezervaci" })).toBeVisible();
    await expect(page.getByText("Celkem registrací")).toBeVisible();
    await expect(page.getByRole("region", { name: "Hromadné akce" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

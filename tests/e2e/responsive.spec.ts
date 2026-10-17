import { test, expect } from "@playwright/test";

const VIEWPORTS = [
  { name: "foldable-narrow", width: 280, height: 653 },
  { name: "iphone-se-1st", width: 320, height: 568 },
  { name: "android-small", width: 360, height: 640 },
  { name: "iphone-se-2nd", width: 375, height: 667 },
  { name: "iphone-12", width: 390, height: 844 },
  { name: "iphone-15-pro-max", width: 430, height: 932 },
  { name: "phone-landscape-1", width: 667, height: 375 },
  { name: "phone-landscape-2", width: 844, height: 390 },
  { name: "tablet-fold-landscape", width: 717, height: 512 },
  { name: "tablet-portrait-ipad", width: 768, height: 1024 },
  { name: "tablet-portrait-air", width: 820, height: 1180 },
  { name: "tablet-landscape-ipad", width: 1024, height: 768 },
  { name: "tablet-landscape-air", width: 1180, height: 820 },
  { name: "laptop-small", width: 1280, height: 800 },
  { name: "laptop-standard", width: 1440, height: 900 },
  { name: "desktop-fhd", width: 1920, height: 1080 },
  { name: "desktop-qhd", width: 2560, height: 1440 },
];

const PAGES = ["/", "/voices", "/history", "/settings", "/privacy", "/terms"];

test.describe("Responsive Layout & Viewport Overflow Tests", () => {
  for (const vp of VIEWPORTS) {
    test(`No horizontal overflow on pages at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      for (const path of PAGES) {
        await page.goto(path);
        // Wait for page to be settled
        await page.waitForLoadState("domcontentloaded");

        // Verify that document does not horizontally scroll
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const innerWidth = await page.evaluate(() => window.innerWidth);

        // Expect no horizontal scrollbar / overflow (tolerance for subpixel roundoff <= 1px)
        expect(
          scrollWidth,
          `Horizontal overflow detected on ${path} at viewport ${vp.name} (${vp.width}x${vp.height}): scrollWidth ${scrollWidth} > innerWidth ${innerWidth}`
        ).toBeLessThanOrEqual(innerWidth + 1);
      }
    });
  }

  test("Mobile bottom bar and sticky action bar work properly on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    // Bottom navigation should be visible on mobile
    const bottomNav = page.getByRole("navigation", { name: "Mobile Navigation" });
    await expect(bottomNav).toBeVisible();

    // Mobile sticky action bar should be visible on mobile
    const mobileActions = page.getByRole("region", { name: "Mobile rewrite actions" });
    await expect(mobileActions).toBeVisible();

    // Toolbar desktop button should be hidden
    const desktopRewriteWrap = page.locator(".hidden.min-\\[681px\\]\\:flex");
    await expect(desktopRewriteWrap).toBeHidden();
  });

  test("Desktop navigation and toolbar button visible on desktop viewports", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    // Mobile bottom nav should be hidden
    const bottomNav = page.getByRole("navigation", { name: "Mobile Navigation" });
    await expect(bottomNav).toBeHidden();

    // Mobile sticky actions should be hidden
    const mobileActions = page.getByRole("region", { name: "Mobile rewrite actions" });
    await expect(mobileActions).toBeHidden();

    // Desktop header navigation should be visible
    const primaryNav = page.getByRole("navigation", { name: "Primary" });
    await expect(primaryNav).toBeVisible();
  });
});

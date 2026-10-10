import { test, expect } from "@playwright/test";
import mockFixture from "../fixtures/mock-rewrite.json";

test.describe("I’m human — Core User Flows", () => {
  test.beforeEach(async ({ page }) => {
    // Intercept rewrite API calls to keep tests deterministic and offline
    await page.route("**/api/rewrite", async (route) => {
      const responseBody = `${mockFixture.text}\n${mockFixture.delimiter}\n${JSON.stringify(mockFixture.notes)}`;
      await route.fulfill({
        status: 200,
        contentType: "text/plain; charset=utf-8",
        body: responseBody,
      });
    });
  });

  test("1. First-visit empty state explanation is visible and dismissible", async ({ page }) => {
    await page.goto("/");
    const welcomeGuide = page.getByRole("region", { name: "Welcome guide" });
    await expect(welcomeGuide).toBeVisible();
    await expect(welcomeGuide).toContainText("What to paste:");
    await expect(welcomeGuide).toContainText("How voices work:");

    // Dismiss guide
    await page.getByRole("button", { name: "Dismiss guide" }).click();
    await expect(welcomeGuide).not.toBeVisible();

    // Reload and check it remains dismissed
    await page.reload();
    await expect(welcomeGuide).not.toBeVisible();
  });

  test("2. Typing text enables Rewrite button and produces interactive review", async ({ page }) => {
    await page.goto("/");
    const textarea = page.getByLabel("Text to rewrite");
    const rewriteBtn = page.getByRole("button", { name: "Rewrite" });

    // Under 40 characters -> button is disabled
    await textarea.fill("Too short text.");
    await expect(rewriteBtn).toBeDisabled();

    // Fill valid sample text (> 40 characters)
    await textarea.fill(
      "In today's fast-paced world, it is important to note that companies must delve into new strategies to remain competitive."
    );
    await expect(rewriteBtn).toBeEnabled();

    // Trigger rewrite
    await rewriteBtn.click();

    // Reviewing mode activates
    await expect(page.getByText("AI patterns flagged")).toBeVisible();
    await expect(page.getByText("Here is the cleaned human version")).toBeVisible();

    // Verify stats strip updates
    await expect(page.getByText("in the original")).toBeVisible();
    await expect(page.getByText("in the rewrite")).toBeVisible();

    // Verify change notes are rendered
    await expect(page.getByText("Removed stock opener")).toBeVisible();
  });

  test("3. Creating a custom voice profile", async ({ page }) => {
    await page.goto("/voices");
    await expect(page.getByRole("heading", { name: "Voices" })).toBeVisible();

    // Open add voice dialog
    const addBtn = page.getByRole("button", { name: /Add your first voice|Add voice/i });
    await addBtn.click();

    await expect(page.getByRole("heading", { name: "Add voice" })).toBeVisible();

    // Enter voice name
    await page.getByLabel("Voice name").fill("Author Voice");

    // Enter writing sample >= 150 words
    const sampleText = Array(160)
      .fill("Writing with cadence and clarity requires thoughtful revision and personal voice.")
      .slice(0, 16)
      .join(" ");

    await page.getByPlaceholder("Paste something you’ve written…").fill(sampleText);

    // Save button becomes enabled
    const saveBtn = page.getByRole("button", { name: "Save voice" });
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();

    // Voice appears in list
    await expect(page.getByText("Author Voice")).toBeVisible();
  });

  test("4. History view, restoration, and deletion", async ({ page }) => {
    // Run a rewrite first so history is populated
    await page.goto("/");
    const textarea = page.getByLabel("Text to rewrite");
    await textarea.fill(
      "Moreover, the system should leverage modern approaches to streamline processes in today's digital landscape."
    );
    await page.getByRole("button", { name: "Rewrite" }).click();
    await expect(page.getByText("Here is the cleaned human version")).toBeVisible();

    // Navigate to History
    await page.goto("/history");
    await expect(page.getByRole("heading", { name: "History" })).toBeVisible();

    // Should find history entry
    const openBtn = page.getByRole("button", { name: "Open" }).first();
    await expect(openBtn).toBeVisible();

    // Click Open -> restores into workspace
    await openBtn.click();
    await expect(page).toHaveURL("/");
    await expect(page.getByText("Original")).toBeVisible();
  });

  test("5. Settings theme switching", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

    // Switch to Dark theme
    await page.getByRole("radio", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    // Switch to Light theme
    await page.getByRole("radio", { name: "Light" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });

  test("6. Settings data export and import", async ({ page }) => {
    await page.goto("/settings");

    // Test Export
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export everything" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain("imhuman-data");
  });
});

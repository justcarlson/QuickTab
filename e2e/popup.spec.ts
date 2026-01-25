import { expect, test } from "./fixtures";

test.describe("Popup UI", () => {
	test("should load popup and display mode options", async ({ context, extensionId }) => {
		// Open popup page directly
		const popup = await context.newPage();
		await popup.goto(`chrome-extension://${extensionId}/popup.html`);

		// Verify popup loaded by checking header
		await expect(popup.locator("h1")).toHaveText("QuickTab");

		// Verify mode toggle exists with three options
		await expect(popup.locator('input[type="radio"][name="detection-mode"]')).toHaveCount(3);

		// Verify each mode option is present
		await expect(popup.locator('input[name="detection-mode"][value="allUrls"]')).toBeVisible();
		await expect(popup.locator('input[name="detection-mode"][value="ticketUrls"]')).toBeVisible();
		await expect(popup.locator('input[name="detection-mode"][value="noUrls"]')).toBeVisible();
	});

	test("should change mode when radio button clicked", async ({ context, extensionId }) => {
		const popup = await context.newPage();
		await popup.goto(`chrome-extension://${extensionId}/popup.html`);

		// Click the label containing the ticketUrls radio (custom-styled radio)
		const ticketUrlsLabel = popup.locator('label.mode-option:has(input[value="ticketUrls"])');
		await ticketUrlsLabel.click();

		// Verify the radio is now checked
		const ticketUrlsRadio = popup.locator('input[name="detection-mode"][value="ticketUrls"]');
		await expect(ticketUrlsRadio).toBeChecked();
	});

	test("should persist mode after popup reopen", async ({ context, extensionId }) => {
		// Open popup and change mode
		const popup1 = await context.newPage();
		await popup1.goto(`chrome-extension://${extensionId}/popup.html`);

		// Click the label containing the noUrls radio (custom-styled radio)
		const noUrlsLabel = popup1.locator('label.mode-option:has(input[value="noUrls"])');
		await noUrlsLabel.click();

		// Verify the radio is now checked
		const noUrlsRadio = popup1.locator('input[name="detection-mode"][value="noUrls"]');
		await expect(noUrlsRadio).toBeChecked();

		// Close popup
		await popup1.close();

		// Reopen popup
		const popup2 = await context.newPage();
		await popup2.goto(`chrome-extension://${extensionId}/popup.html`);

		// Verify mode persisted
		await expect(popup2.locator('input[name="detection-mode"][value="noUrls"]')).toBeChecked();
	});
});

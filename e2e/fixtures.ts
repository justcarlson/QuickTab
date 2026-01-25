/**
 * Playwright fixtures for Chrome extension E2E testing
 *
 * Per RESEARCH.md Pattern 3: Extension fixtures with persistent context
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { type BrowserContext, test as base, chromium } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const test = base.extend<{
	context: BrowserContext;
	extensionId: string;
}>({
	// Override context to load extension
	// biome-ignore lint/correctness/noEmptyPattern: Playwright fixture pattern requires empty destructure
	context: async ({}, use) => {
		const pathToExtension = path.join(__dirname, "../.output/chrome-mv3");
		const context = await chromium.launchPersistentContext("", {
			headless: false, // Extensions require headed mode
			args: [
				"--headless=new", // Use new headless mode that supports extensions
				`--disable-extensions-except=${pathToExtension}`,
				`--load-extension=${pathToExtension}`,
			],
		});
		await use(context);
		await context.close();
	},
	// Derive extension ID from service worker URL
	extensionId: async ({ context }, use) => {
		// Wait for service worker to be available (MV3)
		let [serviceWorker] = context.serviceWorkers();
		if (!serviceWorker) {
			serviceWorker = await context.waitForEvent("serviceworker");
		}
		// Extract extension ID from service worker URL
		// Format: chrome-extension://[extension-id]/background.js
		const extensionId = serviceWorker.url().split("/")[2];
		await use(extensionId);
	},
});

export { expect } from "@playwright/test";

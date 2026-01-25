import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	// Extensions need sequential execution - no parallelism
	fullyParallel: false,
	workers: 1,
	// Fail CI if test.only left in
	forbidOnly: !!process.env.CI,
	// Retry on CI for flaky extension loading
	retries: process.env.CI ? 2 : 0,
	reporter: process.env.CI ? "github" : "html",
	use: {
		// Capture trace on first retry for debugging
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	// Build extension before running E2E tests
	webServer: {
		command: "npm run build",
		reuseExistingServer: true,
	},
});

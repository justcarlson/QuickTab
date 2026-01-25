import { describe, expect, it } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";

describe("Chrome API mocking (TEST-02 smoke test)", () => {
	it("fakeBrowser.reset() is available and works", () => {
		// This verifies WxtVitest plugin configured fake-browser correctly
		expect(fakeBrowser).toBeDefined();
		expect(typeof fakeBrowser.reset).toBe("function");

		// Verify reset doesn't throw
		expect(() => fakeBrowser.reset()).not.toThrow();
	});

	it("chrome.storage.local is mocked via fake-browser", async () => {
		// Verify storage mock works
		await fakeBrowser.storage.local.set({ testKey: "testValue" });
		const result = await fakeBrowser.storage.local.get("testKey");
		expect(result.testKey).toBe("testValue");
	});
});

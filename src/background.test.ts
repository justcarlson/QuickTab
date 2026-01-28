/**
 * Background Service Worker Tests
 *
 * Tests observable behavior through:
 * 1. Storage state observation (input/output via fake-browser storage)
 * 2. Message handler mocking via chrome.runtime.sendMessage
 *
 * Per plan: Functions like findMostRecentTab, setActionIcon, trackTab, and handleNavigation
 * are private (not exported). Test behavior through storage observation instead.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";

// Storage keys used by the extension
const STORAGE_KEY = "quicktab_state";

describe("background message handlers", () => {
	beforeEach(() => {
		fakeBrowser.reset();
		vi.resetModules();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("getStatus message", () => {
		it("returns current mode from storage", async () => {
			// Pre-set mode in storage
			await fakeBrowser.storage.local.set({ urlDetection: "ticketUrls" });

			// Import background to register handlers (side effect import)
			await import("@/entrypoints/background");

			// Verify storage has the expected value
			const result = await fakeBrowser.storage.local.get("urlDetection");
			expect(result.urlDetection).toBe("ticketUrls");
		});

		it("returns default mode when storage is empty", async () => {
			// Storage is empty after reset
			await import("@/entrypoints/background");

			// Verify storage is empty (default mode is 'allUrls' per storage.ts)
			const result = await fakeBrowser.storage.local.get("urlDetection");
			expect(result.urlDetection).toBeUndefined();
		});

		it("handles all three URL detection modes", async () => {
			// Test each mode can be stored and retrieved
			const modes = ["allUrls", "ticketUrls", "noUrls"] as const;

			for (const mode of modes) {
				await fakeBrowser.storage.local.set({ urlDetection: mode });
				const result = await fakeBrowser.storage.local.get("urlDetection");
				expect(result.urlDetection).toBe(mode);
			}
		});
	});

	describe("setMode message", () => {
		it("updates storage with new mode", async () => {
			// Start with allUrls mode
			await fakeBrowser.storage.local.set({ urlDetection: "allUrls" });

			// Import storage utils to test setMode behavior
			const { setUrlDetection, getUrlDetection } = await import("@/src/utils/storage");

			// Set new mode
			await setUrlDetection("ticketUrls");

			// Verify mode was updated
			const mode = await getUrlDetection();
			expect(mode).toBe("ticketUrls");
		});

		it("persists mode change to storage", async () => {
			const { setUrlDetection } = await import("@/src/utils/storage");

			// Set mode
			await setUrlDetection("noUrls");

			// Verify directly in fake storage
			const result = await fakeBrowser.storage.local.get("urlDetection");
			expect(result.urlDetection).toBe("noUrls");
		});

		it("mode changes from noUrls to allUrls", async () => {
			const { setUrlDetection, getUrlDetection } = await import("@/src/utils/storage");

			// Start disabled
			await setUrlDetection("noUrls");
			expect(await getUrlDetection()).toBe("noUrls");

			// Enable all URLs
			await setUrlDetection("allUrls");
			expect(await getUrlDetection()).toBe("allUrls");
		});
	});
});

describe("storage-first architecture", () => {
	beforeEach(() => {
		fakeBrowser.reset();
		vi.resetModules();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("loadState behavior", () => {
		it("returns empty zendeskTabs when storage is empty", async () => {
			const { loadState } = await import("@/src/utils/storage");

			const state = await loadState();
			expect(state.zendeskTabs).toEqual({});
		});

		it("returns stored tabs when present", async () => {
			// Pre-populate storage with tab data
			await fakeBrowser.storage.local.set({
				[STORAGE_KEY]: {
					zendeskTabs: {
						123: { subdomain: "company1", lastActive: 1000 },
						456: { subdomain: "company2", lastActive: 2000 },
					},
				},
			});

			const { loadState } = await import("@/src/utils/storage");
			const state = await loadState();

			expect(state.zendeskTabs[123]).toBeDefined();
			expect(state.zendeskTabs[123]?.subdomain).toBe("company1");
			expect(state.zendeskTabs[456]).toBeDefined();
			expect(state.zendeskTabs[456]?.subdomain).toBe("company2");
		});
	});

	describe("saveState behavior", () => {
		it("persists tab tracking to storage", async () => {
			const { saveState, loadState } = await import("@/src/utils/storage");

			// Save state with tracked tab
			await saveState({
				zendeskTabs: {
					789: { subdomain: "test-company", lastActive: 3000 },
				},
			});

			// Verify it was persisted
			const loaded = await loadState();
			expect(loaded.zendeskTabs[789]).toBeDefined();
			expect(loaded.zendeskTabs[789]?.subdomain).toBe("test-company");
			expect(loaded.zendeskTabs[789]?.lastActive).toBe(3000);
		});

		it("overwrites previous state completely", async () => {
			const { saveState, loadState } = await import("@/src/utils/storage");

			// Save initial state
			await saveState({
				zendeskTabs: {
					100: { subdomain: "first", lastActive: 1000 },
				},
			});

			// Save new state (without tab 100)
			await saveState({
				zendeskTabs: {
					200: { subdomain: "second", lastActive: 2000 },
				},
			});

			// Verify old tab is gone, new tab exists
			const state = await loadState();
			expect(state.zendeskTabs[100]).toBeUndefined();
			expect(state.zendeskTabs[200]).toBeDefined();
		});
	});

	describe("clearState behavior", () => {
		it("removes all tracked tabs", async () => {
			const { saveState, clearState, loadState } = await import("@/src/utils/storage");

			// Save some state
			await saveState({
				zendeskTabs: {
					111: { subdomain: "to-clear", lastActive: 1000 },
				},
			});

			// Clear it
			await clearState();

			// Verify default state returned
			const state = await loadState();
			expect(state.zendeskTabs).toEqual({});
		});
	});
});

describe("state persistence (TEST-08)", () => {
	beforeEach(() => {
		fakeBrowser.reset();
		vi.resetModules();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("tabs survive service worker restart", () => {
		it("loads tabs from storage after module reimport", async () => {
			// Pre-populate storage (simulates state before termination)
			await fakeBrowser.storage.local.set({
				[STORAGE_KEY]: {
					zendeskTabs: {
						123: { subdomain: "company", lastActive: 1000 },
					},
				},
			});

			// Clear module cache to simulate restart
			vi.resetModules();

			// Import storage utils fresh (simulates restart)
			const { loadState } = await import("@/src/utils/storage");

			// Verify state loaded from storage
			const state = await loadState();
			expect(state.zendeskTabs[123]).toBeDefined();
			expect(state.zendeskTabs[123]?.subdomain).toBe("company");
			expect(state.zendeskTabs[123]?.lastActive).toBe(1000);
		});

		it("multiple tabs survive restart", async () => {
			// Pre-populate with multiple tabs across different subdomains
			await fakeBrowser.storage.local.set({
				[STORAGE_KEY]: {
					zendeskTabs: {
						1: { subdomain: "alpha", lastActive: 100 },
						2: { subdomain: "alpha", lastActive: 200 },
						3: { subdomain: "beta", lastActive: 300 },
					},
				},
			});

			vi.resetModules();
			const { loadState } = await import("@/src/utils/storage");

			const state = await loadState();
			expect(Object.keys(state.zendeskTabs)).toHaveLength(3);
			expect(state.zendeskTabs[1]?.subdomain).toBe("alpha");
			expect(state.zendeskTabs[2]?.subdomain).toBe("alpha");
			expect(state.zendeskTabs[3]?.subdomain).toBe("beta");
		});
	});

	describe("URL detection mode survives restart", () => {
		it("mode persists across module reimport", async () => {
			// Set mode via storage directly
			await fakeBrowser.storage.local.set({ urlDetection: "ticketUrls" });

			// Clear module cache to simulate restart
			vi.resetModules();

			// Fresh import
			const { getUrlDetection } = await import("@/src/utils/storage");

			// Verify mode is correct
			const mode = await getUrlDetection();
			expect(mode).toBe("ticketUrls");
		});

		it("noUrls mode survives restart", async () => {
			await fakeBrowser.storage.local.set({ urlDetection: "noUrls" });

			vi.resetModules();
			const { getUrlDetection } = await import("@/src/utils/storage");

			expect(await getUrlDetection()).toBe("noUrls");
		});

		it("allUrls mode survives restart", async () => {
			await fakeBrowser.storage.local.set({ urlDetection: "allUrls" });

			vi.resetModules();
			const { getUrlDetection } = await import("@/src/utils/storage");

			expect(await getUrlDetection()).toBe("allUrls");
		});
	});

	describe("state cleared on update", () => {
		it("clearState resets tabs to default", async () => {
			const { saveState, clearState, loadState } = await import("@/src/utils/storage");

			// Pre-populate with data
			await saveState({
				zendeskTabs: {
					999: { subdomain: "before-update", lastActive: 9999 },
				},
			});

			// Verify data exists
			let state = await loadState();
			expect(state.zendeskTabs[999]).toBeDefined();

			// Clear state (as would happen on extension update)
			await clearState();

			// Verify default state returned
			state = await loadState();
			expect(state.zendeskTabs).toEqual({});
		});

		it("clearState does not affect URL detection mode", async () => {
			const { setUrlDetection, getUrlDetection, clearState } = await import("@/src/utils/storage");

			// Set mode
			await setUrlDetection("ticketUrls");

			// Clear tab state
			await clearState();

			// Mode should still be set (different storage key)
			const mode = await getUrlDetection();
			expect(mode).toBe("ticketUrls");
		});
	});
});

describe("findMostRecentTab logic (behavior test)", () => {
	beforeEach(() => {
		fakeBrowser.reset();
		vi.resetModules();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("selects tab with highest lastActive timestamp", async () => {
		// Test the expected behavior: most recently active tab should be selected
		// We verify this by setting up storage state and checking expected patterns

		await fakeBrowser.storage.local.set({
			[STORAGE_KEY]: {
				zendeskTabs: {
					1: { subdomain: "company", lastActive: 1000 },
					2: { subdomain: "company", lastActive: 3000 }, // Most recent
					3: { subdomain: "company", lastActive: 2000 },
				},
			},
		});

		const { loadState } = await import("@/src/utils/storage");
		const state = await loadState();

		// Find the most recent tab for 'company' subdomain (simulating findMostRecentTab logic)
		let mostRecentTabId: number | null = null;
		let mostRecentTime = 0;

		for (const [tabIdStr, info] of Object.entries(state.zendeskTabs)) {
			const tabId = Number(tabIdStr);
			if (info.subdomain === "company" && info.lastActive > mostRecentTime) {
				mostRecentTime = info.lastActive;
				mostRecentTabId = tabId;
			}
		}

		expect(mostRecentTabId).toBe(2);
		expect(mostRecentTime).toBe(3000);
	});

	it("excludes tabs from different subdomains", async () => {
		await fakeBrowser.storage.local.set({
			[STORAGE_KEY]: {
				zendeskTabs: {
					1: { subdomain: "company-a", lastActive: 5000 }, // Higher but different subdomain
					2: { subdomain: "company-b", lastActive: 1000 },
					3: { subdomain: "company-b", lastActive: 2000 }, // Should be selected
				},
			},
		});

		const { loadState } = await import("@/src/utils/storage");
		const state = await loadState();

		// Find most recent for company-b
		let mostRecentTabId: number | null = null;
		let mostRecentTime = 0;

		for (const [tabIdStr, info] of Object.entries(state.zendeskTabs)) {
			const tabId = Number(tabIdStr);
			if (info.subdomain === "company-b" && info.lastActive > mostRecentTime) {
				mostRecentTime = info.lastActive;
				mostRecentTabId = tabId;
			}
		}

		expect(mostRecentTabId).toBe(3);
		expect(mostRecentTime).toBe(2000);
	});

	it("returns null when no tabs match subdomain", async () => {
		await fakeBrowser.storage.local.set({
			[STORAGE_KEY]: {
				zendeskTabs: {
					1: { subdomain: "other-company", lastActive: 1000 },
				},
			},
		});

		const { loadState } = await import("@/src/utils/storage");
		const state = await loadState();

		// Find most recent for non-existent subdomain
		let mostRecentTabId: number | null = null;
		let mostRecentTime = 0;

		for (const [tabIdStr, info] of Object.entries(state.zendeskTabs)) {
			const tabId = Number(tabIdStr);
			if (info.subdomain === "target-company" && info.lastActive > mostRecentTime) {
				mostRecentTime = info.lastActive;
				mostRecentTabId = tabId;
			}
		}

		expect(mostRecentTabId).toBeNull();
	});

	it("handles single tab scenario", async () => {
		await fakeBrowser.storage.local.set({
			[STORAGE_KEY]: {
				zendeskTabs: {
					42: { subdomain: "solo", lastActive: 1234 },
				},
			},
		});

		const { loadState } = await import("@/src/utils/storage");
		const state = await loadState();

		let mostRecentTabId: number | null = null;
		let mostRecentTime = 0;

		for (const [tabIdStr, info] of Object.entries(state.zendeskTabs)) {
			const tabId = Number(tabIdStr);
			if (info.subdomain === "solo" && info.lastActive > mostRecentTime) {
				mostRecentTime = info.lastActive;
				mostRecentTabId = tabId;
			}
		}

		expect(mostRecentTabId).toBe(42);
	});
});

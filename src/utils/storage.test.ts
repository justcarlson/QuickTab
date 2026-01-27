/**
 * Unit tests for storage module
 *
 * Tests all five exported functions: loadState, saveState, getUrlDetection,
 * setUrlDetection, clearState
 *
 * Uses @webext-core/fake-browser via WXT for stateful Chrome API mocking.
 * Per RESEARCH.md Pattern 4: fakeBrowser provides stateful in-memory storage.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";
import {
	clearState,
	getUrlDetection,
	loadAll,
	loadState,
	saveState,
	setUrlDetection,
} from "./storage";

describe("storage", () => {
	// Reset is handled globally in vitest.setup.ts, but explicit reset ensures isolation
	beforeEach(() => {
		fakeBrowser.reset();
	});

	describe("loadState", () => {
		it("returns default state when storage is empty", async () => {
			const state = await loadState();
			expect(state).toEqual({ zendeskTabs: {} });
		});

		it("returns stored state when data exists", async () => {
			const testState = {
				zendeskTabs: {
					1: { subdomain: "company", lastActive: 123456 },
					2: { subdomain: "other", lastActive: 789012 },
				},
			};
			await fakeBrowser.storage.local.set({ quicktab_state: testState });

			const state = await loadState();
			expect(state).toEqual(testState);
		});

		it("returns default state on storage error (silent fallback)", async () => {
			// Mock storage.local.get to throw an error
			vi.spyOn(chrome.storage.local, "get").mockRejectedValueOnce(new Error("Storage error"));
			const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

			const state = await loadState();

			expect(state).toEqual({ zendeskTabs: {} });
			expect(warnSpy).toHaveBeenCalledWith(
				"QuickTab: Storage read failed, using default state",
				expect.any(Error),
			);

			warnSpy.mockRestore();
		});
	});

	describe("saveState", () => {
		it("persists state to storage", async () => {
			const testState = {
				zendeskTabs: { 1: { subdomain: "test", lastActive: 100 } },
			};

			await saveState(testState);

			const result = await fakeBrowser.storage.local.get("quicktab_state");
			expect(result.quicktab_state).toEqual(testState);
		});

		it("stored state is retrievable via loadState", async () => {
			const testState = {
				zendeskTabs: {
					5: { subdomain: "acme", lastActive: 555 },
				},
			};

			await saveState(testState);
			const loaded = await loadState();

			expect(loaded).toEqual(testState);
		});

		it("silent fallback on storage error (no throw)", async () => {
			vi.spyOn(chrome.storage.local, "set").mockRejectedValueOnce(new Error("Write error"));
			const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

			// Should not throw
			await expect(
				saveState({ zendeskTabs: { 1: { subdomain: "x", lastActive: 1 } } }),
			).resolves.toBeUndefined();

			expect(warnSpy).toHaveBeenCalledWith("QuickTab: Storage write failed", expect.any(Error));

			warnSpy.mockRestore();
		});
	});

	describe("getUrlDetection", () => {
		it("returns 'allUrls' when no mode set (default)", async () => {
			const mode = await getUrlDetection();
			expect(mode).toBe("allUrls");
		});

		it("returns stored mode when set", async () => {
			await fakeBrowser.storage.local.set({ urlDetection: "ticketUrls" });

			const mode = await getUrlDetection();
			expect(mode).toBe("ticketUrls");
		});

		it("returns 'allUrls' on storage error (fallback)", async () => {
			vi.spyOn(chrome.storage.local, "get").mockRejectedValueOnce(new Error("Read error"));
			const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

			const mode = await getUrlDetection();

			expect(mode).toBe("allUrls");
			expect(warnSpy).toHaveBeenCalledWith(
				"QuickTab: Failed to read URL detection mode",
				expect.any(Error),
			);

			warnSpy.mockRestore();
		});
	});

	describe("setUrlDetection", () => {
		it("persists mode to storage", async () => {
			await setUrlDetection("noUrls");

			const result = await fakeBrowser.storage.local.get("urlDetection");
			expect(result.urlDetection).toBe("noUrls");
		});

		it("mode is retrievable via getUrlDetection", async () => {
			await setUrlDetection("ticketUrls");

			const mode = await getUrlDetection();
			expect(mode).toBe("ticketUrls");
		});

		it("all three modes work: allUrls, ticketUrls, noUrls", async () => {
			// Test each mode
			await setUrlDetection("allUrls");
			expect(await getUrlDetection()).toBe("allUrls");

			await setUrlDetection("ticketUrls");
			expect(await getUrlDetection()).toBe("ticketUrls");

			await setUrlDetection("noUrls");
			expect(await getUrlDetection()).toBe("noUrls");
		});

		it("silent fallback on storage error", async () => {
			vi.spyOn(chrome.storage.local, "set").mockRejectedValueOnce(new Error("Write error"));
			const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

			// Should not throw
			await expect(setUrlDetection("ticketUrls")).resolves.toBeUndefined();

			expect(warnSpy).toHaveBeenCalledWith(
				"QuickTab: Failed to write URL detection mode",
				expect.any(Error),
			);

			warnSpy.mockRestore();
		});
	});

	describe("loadAll", () => {
		it("returns both mode and state in a single call", async () => {
			// Set up both values in storage
			await fakeBrowser.storage.local.set({
				urlDetection: "ticketUrls",
				quicktab_state: {
					zendeskTabs: { 1: { subdomain: "test", lastActive: 123 } },
				},
			});

			const result = await loadAll();

			expect(result.mode).toBe("ticketUrls");
			expect(result.state).toEqual({
				zendeskTabs: { 1: { subdomain: "test", lastActive: 123 } },
			});
		});

		it("returns defaults when storage is empty", async () => {
			const result = await loadAll();

			expect(result.mode).toBe("allUrls");
			expect(result.state).toEqual({ zendeskTabs: {} });
		});

		it("returns partial defaults when only mode is set", async () => {
			await fakeBrowser.storage.local.set({ urlDetection: "noUrls" });

			const result = await loadAll();

			expect(result.mode).toBe("noUrls");
			expect(result.state).toEqual({ zendeskTabs: {} });
		});

		it("returns partial defaults when only state is set", async () => {
			await fakeBrowser.storage.local.set({
				quicktab_state: {
					zendeskTabs: { 5: { subdomain: "acme", lastActive: 500 } },
				},
			});

			const result = await loadAll();

			expect(result.mode).toBe("allUrls");
			expect(result.state).toEqual({
				zendeskTabs: { 5: { subdomain: "acme", lastActive: 500 } },
			});
		});

		it("returns defaults on storage error (silent fallback)", async () => {
			vi.spyOn(chrome.storage.local, "get").mockRejectedValueOnce(new Error("Storage error"));
			const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

			const result = await loadAll();

			expect(result.mode).toBe("allUrls");
			expect(result.state).toEqual({ zendeskTabs: {} });
			expect(warnSpy).toHaveBeenCalledWith(
				"QuickTab: Storage read failed, using defaults",
				expect.any(Error),
			);

			warnSpy.mockRestore();
		});
	});

	describe("clearState", () => {
		it("removes quicktab_state from storage", async () => {
			// Set some state first
			await fakeBrowser.storage.local.set({
				quicktab_state: { zendeskTabs: { 1: { subdomain: "x", lastActive: 1 } } },
			});

			await clearState();

			const result = await fakeBrowser.storage.local.get("quicktab_state");
			expect(result.quicktab_state).toBeUndefined();
		});

		it("loadState returns default after clear", async () => {
			// Set state, clear it, verify default
			await saveState({
				zendeskTabs: { 99: { subdomain: "company", lastActive: 999 } },
			});
			await clearState();

			const state = await loadState();
			expect(state).toEqual({ zendeskTabs: {} });
		});

		it("silent fallback on storage error", async () => {
			vi.spyOn(chrome.storage.local, "remove").mockRejectedValueOnce(new Error("Remove error"));
			const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

			// Should not throw
			await expect(clearState()).resolves.toBeUndefined();

			expect(warnSpy).toHaveBeenCalledWith("QuickTab: Failed to clear state", expect.any(Error));

			warnSpy.mockRestore();
		});
	});
});

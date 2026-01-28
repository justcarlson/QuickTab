/**
 * Unit tests for tabs module
 *
 * Tests all four exported functions: focusTab, updateTabUrl, closeTab, queryZendeskTabs
 *
 * Uses vi.spyOn to mock Chrome tabs API since fakeBrowser may not fully support
 * all tabs operations. Per RESEARCH.md: use spyOn for specific method mocking.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { closeTab, focusTab, queryZendeskTabs, updateLotusRoute, updateTabUrl } from "./tabs";

describe("tabs", () => {
	beforeEach(() => {
		fakeBrowser.reset();
		vi.restoreAllMocks();
	});

	describe("focusTab", () => {
		it("returns true and focuses existing tab", async () => {
			const tabId = 123;
			const windowId = 1;

			// Mock chrome.tabs.get to return a tab
			vi.spyOn(chrome.tabs, "get").mockResolvedValueOnce({
				id: tabId,
				windowId,
				index: 0,
				pinned: false,
				highlighted: false,
				active: false,
				incognito: false,
				selected: false,
				discarded: false,
				autoDiscardable: true,
				groupId: -1,
			});

			// Mock chrome.tabs.update to succeed
			// @ts-expect-error - fake-browser types methods as void, but actual Chrome API returns Tab
			vi.spyOn(chrome.tabs, "update").mockResolvedValueOnce({
				id: tabId,
				windowId,
				index: 0,
				pinned: false,
				highlighted: true,
				active: true,
				incognito: false,
				selected: true,
				discarded: false,
				autoDiscardable: true,
				groupId: -1,
			});

			// Mock chrome.windows.update to succeed
			// @ts-expect-error - fake-browser types methods as void, but actual Chrome API returns Window
			vi.spyOn(chrome.windows, "update").mockResolvedValueOnce({
				id: windowId,
				focused: true,
				alwaysOnTop: false,
				incognito: false,
			});

			const result = await focusTab(tabId);

			expect(result).toBe(true);
			expect(chrome.tabs.get).toHaveBeenCalledWith(tabId);
			expect(chrome.tabs.update).toHaveBeenCalledWith(tabId, { active: true, highlighted: true });
			expect(chrome.windows.update).toHaveBeenCalledWith(windowId, { focused: true });
		});

		it("brings window to front via chrome.windows.update", async () => {
			const tabId = 456;
			const windowId = 99;

			vi.spyOn(chrome.tabs, "get").mockResolvedValueOnce({
				id: tabId,
				windowId,
				index: 0,
				pinned: false,
				highlighted: false,
				active: false,
				incognito: false,
				selected: false,
				discarded: false,
				autoDiscardable: true,
				groupId: -1,
			});

			// @ts-expect-error - fake-browser types methods as void, but actual Chrome API returns Tab
			vi.spyOn(chrome.tabs, "update").mockResolvedValueOnce({
				id: tabId,
				windowId,
				index: 0,
				pinned: false,
				highlighted: true,
				active: true,
				incognito: false,
				selected: true,
				discarded: false,
				autoDiscardable: true,
				groupId: -1,
			});

			// @ts-expect-error - fake-browser types methods as void, but actual Chrome API returns Window
			const windowsUpdateSpy = vi.spyOn(chrome.windows, "update").mockResolvedValueOnce({
				id: windowId,
				focused: true,
				alwaysOnTop: false,
				incognito: false,
			});

			await focusTab(tabId);

			expect(windowsUpdateSpy).toHaveBeenCalledWith(windowId, { focused: true });
		});

		it("returns false when tab doesn't exist", async () => {
			const tabId = 999;

			// Mock chrome.tabs.get to throw (tab doesn't exist)
			vi.spyOn(chrome.tabs, "get").mockRejectedValueOnce(new Error("Tab not found"));

			const result = await focusTab(tabId);

			expect(result).toBe(false);
		});

		it("returns false when tabs.update fails", async () => {
			const tabId = 123;
			const windowId = 1;

			vi.spyOn(chrome.tabs, "get").mockResolvedValueOnce({
				id: tabId,
				windowId,
				index: 0,
				pinned: false,
				highlighted: false,
				active: false,
				incognito: false,
				selected: false,
				discarded: false,
				autoDiscardable: true,
				groupId: -1,
			});

			// tabs.update fails
			vi.spyOn(chrome.tabs, "update").mockRejectedValueOnce(new Error("Update failed"));

			const result = await focusTab(tabId);

			expect(result).toBe(false);
		});

		it("returns false when windows.update fails", async () => {
			const tabId = 123;
			const windowId = 1;

			vi.spyOn(chrome.tabs, "get").mockResolvedValueOnce({
				id: tabId,
				windowId,
				index: 0,
				pinned: false,
				highlighted: false,
				active: false,
				incognito: false,
				selected: false,
				discarded: false,
				autoDiscardable: true,
				groupId: -1,
			});

			// @ts-expect-error - fake-browser types methods as void, but actual Chrome API returns Tab
			vi.spyOn(chrome.tabs, "update").mockResolvedValueOnce({
				id: tabId,
				windowId,
				index: 0,
				pinned: false,
				highlighted: true,
				active: true,
				incognito: false,
				selected: true,
				discarded: false,
				autoDiscardable: true,
				groupId: -1,
			});

			// windows.update fails
			vi.spyOn(chrome.windows, "update").mockRejectedValueOnce(new Error("Window focus failed"));

			const result = await focusTab(tabId);

			expect(result).toBe(false);
		});
	});

	describe("updateTabUrl", () => {
		it("returns true and updates URL for existing tab", async () => {
			const tabId = 123;
			const url = "https://company.zendesk.com/agent/tickets/456";

			// @ts-expect-error - fake-browser types methods as void, but actual Chrome API returns Tab
			vi.spyOn(chrome.tabs, "update").mockResolvedValueOnce({
				id: tabId,
				windowId: 1,
				index: 0,
				pinned: false,
				highlighted: false,
				active: true,
				incognito: false,
				selected: true,
				discarded: false,
				autoDiscardable: true,
				groupId: -1,
				url,
			});

			const result = await updateTabUrl(tabId, url);

			expect(result).toBe(true);
			expect(chrome.tabs.update).toHaveBeenCalledWith(tabId, { url });
		});

		it("returns false when tab doesn't exist", async () => {
			const tabId = 999;
			const url = "https://company.zendesk.com/agent/tickets/789";

			vi.spyOn(chrome.tabs, "update").mockRejectedValueOnce(new Error("No tab with id: 999"));

			const result = await updateTabUrl(tabId, url);

			expect(result).toBe(false);
		});
	});

	describe("closeTab", () => {
		it("closes existing tab without error", async () => {
			const tabId = 123;

			const removeSpy = vi.spyOn(chrome.tabs, "remove").mockResolvedValueOnce(undefined);

			await closeTab(tabId);

			expect(removeSpy).toHaveBeenCalledWith(tabId);
		});

		it("silently ignores when tab already closed", async () => {
			const tabId = 999;

			// Tab already closed - remove throws
			vi.spyOn(chrome.tabs, "remove").mockRejectedValueOnce(new Error("No tab with id: 999"));

			// Should not throw
			await expect(closeTab(tabId)).resolves.toBeUndefined();
		});
	});

	describe("queryZendeskTabs", () => {
		it("returns matching tabs for Zendesk agent URL pattern", async () => {
			const matchingTabs: chrome.tabs.Tab[] = [
				{
					id: 1,
					windowId: 1,
					index: 0,
					pinned: false,
					highlighted: false,
					active: true,
					incognito: false,
					selected: true,
					discarded: false,
					autoDiscardable: true,
					groupId: -1,
					url: "https://company.zendesk.com/agent/tickets/123",
				},
				{
					id: 2,
					windowId: 1,
					index: 1,
					pinned: false,
					highlighted: false,
					active: false,
					incognito: false,
					selected: false,
					discarded: false,
					autoDiscardable: true,
					groupId: -1,
					url: "https://other.zendesk.com/agent/dashboard",
				},
			];

			vi.spyOn(chrome.tabs, "query").mockResolvedValueOnce(matchingTabs);

			const result = await queryZendeskTabs();

			expect(result).toEqual(matchingTabs);
			expect(chrome.tabs.query).toHaveBeenCalledWith({ url: "*://*.zendesk.com/agent/*" });
		});

		it("returns empty array when no matching tabs", async () => {
			vi.spyOn(chrome.tabs, "query").mockResolvedValueOnce([]);

			const result = await queryZendeskTabs();

			expect(result).toEqual([]);
		});
	});

	describe("updateLotusRoute", () => {
		it("returns true and executes script with correct postMessage format", async () => {
			const tabId = 123;
			const route = "/tickets/456";

			// Mock chrome.scripting.executeScript to succeed
			const executeScriptSpy = vi
				.spyOn(chrome.scripting, "executeScript")
				// @ts-expect-error - fake-browser types methods as void, but actual Chrome API returns InjectionResult[]
				.mockResolvedValueOnce([{ result: undefined }]);

			const result = await updateLotusRoute(tabId, route);

			expect(result).toBe(true);
			expect(executeScriptSpy).toHaveBeenCalledWith({
				target: { tabId },
				func: expect.any(Function),
				args: [route],
			});
		});

		it("passes route to postMessage via args", async () => {
			const tabId = 789;
			const route = "/dashboard";

			let capturedArgs: unknown[] = [];
			vi.spyOn(chrome.scripting, "executeScript").mockImplementationOnce(async (injection) => {
				// Capture the args passed to executeScript
				if ("args" in injection && injection.args) {
					capturedArgs = injection.args;
				}
				return [{ result: undefined }];
			});

			await updateLotusRoute(tabId, route);

			expect(capturedArgs).toEqual([route]);
		});

		it("returns false when tab doesn't exist", async () => {
			const tabId = 999;
			const route = "/tickets/123";

			// Mock executeScript to fail (tab doesn't exist)
			vi.spyOn(chrome.scripting, "executeScript").mockRejectedValueOnce(
				new Error("No tab with id: 999"),
			);

			const result = await updateLotusRoute(tabId, route);

			expect(result).toBe(false);
		});

		it("returns false when script execution fails", async () => {
			const tabId = 123;
			const route = "/tickets/456";

			// Mock executeScript to fail
			vi.spyOn(chrome.scripting, "executeScript").mockRejectedValueOnce(
				new Error("Script execution failed"),
			);

			const result = await updateLotusRoute(tabId, route);

			expect(result).toBe(false);
		});

		it("handles various route formats", async () => {
			const tabId = 123;
			const routes = ["/tickets/123", "/dashboard", "/users/456", "/organizations/789"];

			const executeScriptSpy = vi.spyOn(chrome.scripting, "executeScript");

			for (const route of routes) {
				// @ts-expect-error - fake-browser types methods as void, but actual Chrome API returns InjectionResult[]
				executeScriptSpy.mockResolvedValueOnce([{ result: undefined }]);
				const result = await updateLotusRoute(tabId, route);
				expect(result).toBe(true);
			}

			expect(executeScriptSpy).toHaveBeenCalledTimes(routes.length);
		});
	});
});

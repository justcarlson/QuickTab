/**
 * Type-safe Chrome tabs wrapper with defensive error handling
 * All tab operations wrapped in try/catch for defensive handling per RESEARCH.md pitfall #3
 */

/**
 * Focus a tab and bring its window to front.
 * Per CONTEXT.md: Different window = focus only, bring window to front, don't move tabs.
 *
 * @param tabId - ID of the tab to focus
 * @returns true if tab was focused, false if tab no longer exists
 */
export async function focusTab(tabId: number): Promise<boolean> {
	try {
		const tab = await chrome.tabs.get(tabId);
		await chrome.tabs.update(tabId, { active: true, highlighted: true });
		await chrome.windows.update(tab.windowId, { focused: true });
		return true;
	} catch {
		// Tab no longer exists - caller should clean up from storage
		return false;
	}
}

/**
 * Update a tab's URL.
 * Per CONTEXT.md: Update URL when routing - navigate existing tab to exact new URL.
 *
 * @param tabId - ID of the tab to update
 * @param url - New URL to navigate to
 * @returns true if tab was updated, false if tab no longer exists
 */
export async function updateTabUrl(tabId: number, url: string): Promise<boolean> {
	try {
		await chrome.tabs.update(tabId, { url });
		return true;
	} catch {
		// Tab no longer exists
		return false;
	}
}

/**
 * Close a tab.
 * Silently ignores if tab already closed.
 *
 * @param tabId - ID of the tab to close
 */
export async function closeTab(tabId: number): Promise<void> {
	try {
		await chrome.tabs.remove(tabId);
	} catch {
		// Tab already closed - ignore per RESEARCH.md pitfall #3
	}
}

/**
 * Query for Zendesk agent tabs across all windows.
 * Used for re-detecting tabs on extension install/update.
 *
 * @returns Array of tabs matching Zendesk agent URL pattern
 */
export async function queryZendeskTabs(): Promise<chrome.tabs.Tab[]> {
	return chrome.tabs.query({ url: "*://*.zendesk.com/agent/*" });
}

/**
 * Update Zendesk tab's route via postMessage to SPA.
 *
 * This matches the legacy QuickTab routing mechanism which sends a postMessage
 * to Zendesk's Single Page Application. The SPA listens for these messages and
 * navigates internally via the History API without triggering browser navigation
 * events.
 *
 * This is CRITICAL for avoiding cascade issues where chrome.tabs.update() would
 * trigger new navigation events, causing multiple tabs to close unexpectedly.
 *
 * Legacy implementation (browser.js):
 * ```javascript
 * var message = { "target": "route", "memo": { "hash": route } };
 * var codeToExecute = "window.postMessage('" + JSON.stringify(message) + "', '*')";
 * this.tabs.executeScript(lotusTabId, { code: codeToExecute });
 * ```
 *
 * @param tabId - Tab ID to update
 * @param route - Route path (e.g., "/tickets/123", "/dashboard")
 * @returns true if script executed successfully, false otherwise
 */
export async function updateLotusRoute(tabId: number, route: string): Promise<boolean> {
	try {
		await chrome.scripting.executeScript({
			target: { tabId },
			func: (routePath: string) => {
				// Zendesk SPA expects this exact message format
				const message = { target: "route", memo: { hash: routePath } };
				window.postMessage(JSON.stringify(message), "*");
			},
			args: [route],
		});
		return true;
	} catch (error) {
		console.warn("QuickTab: Failed to update lotus route", tabId, error);
		return false;
	}
}

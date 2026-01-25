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

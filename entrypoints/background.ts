/**
 * QuickTab Service Worker
 *
 * Intercepts Zendesk navigation events and routes them to existing agent tabs.
 * Implements storage-first architecture for MV3 persistence.
 *
 * Per RESEARCH.md and CONTEXT.md:
 * - All event listeners registered synchronously at module scope
 * - State loaded fresh from storage on each handler (storage-first)
 * - No global state variables (service worker terminates)
 */

import { clearState, getUrlDetection, loadState, saveState } from "@/src/utils/storage";
import { closeTab, focusTab, queryZendeskTabs, updateTabUrl } from "@/src/utils/tabs";
import type { RouteMatch, UrlDetectionMode, ZendeskTabInfo } from "@/src/utils/types";
import { buildZendeskUrl, isZendeskAgentUrl, matchZendeskUrl } from "@/src/utils/url-matching";

/**
 * Find the most recently active tab for a given subdomain.
 * Per CONTEXT.md: Multiple matching tabs use most recently active tab.
 *
 * @param zendeskTabs - Record of tab info keyed by tab ID
 * @param subdomain - Zendesk subdomain to match
 * @param excludeTabId - Tab ID to exclude from search (the source tab)
 * @returns Tab ID of most recently active tab, or null if none found
 */
function findMostRecentTab(
	zendeskTabs: Record<number, ZendeskTabInfo>,
	subdomain: string,
	excludeTabId: number,
): number | null {
	let mostRecentTabId: number | null = null;
	let mostRecentTime = 0;

	for (const [tabIdStr, info] of Object.entries(zendeskTabs)) {
		const tabId = Number(tabIdStr);
		if (tabId === excludeTabId) continue;
		if (info.subdomain !== subdomain) continue;

		if (info.lastActive > mostRecentTime) {
			mostRecentTime = info.lastActive;
			mostRecentTabId = tabId;
		}
	}

	return mostRecentTabId;
}

/**
 * Handle navigation interception and tab routing.
 * Core routing logic per existing extension behavior.
 *
 * @param sourceTabId - Tab ID that initiated the navigation
 * @param sourceUrl - URL being navigated to
 * @param match - Matched route details
 */
async function handleNavigation(
	sourceTabId: number,
	sourceUrl: string,
	match: RouteMatch,
): Promise<void> {
	const state = await loadState();

	// Find existing tab for this subdomain (not the source tab)
	const existingTabId = findMostRecentTab(state.zendeskTabs, match.subdomain, sourceTabId);

	if (existingTabId !== null) {
		// Route to existing tab
		const targetUrl = buildZendeskUrl(match);
		const updated = await updateTabUrl(existingTabId, targetUrl);

		if (updated) {
			await focusTab(existingTabId);
			await closeTab(sourceTabId);

			// Update lastActive for the target tab
			state.zendeskTabs[existingTabId] = {
				...state.zendeskTabs[existingTabId],
				lastActive: Date.now(),
			};

			// Remove source tab from tracking (it's now closed)
			delete state.zendeskTabs[sourceTabId];
			await saveState(state);
		} else {
			// Target tab no longer exists, clean up and track source tab instead
			delete state.zendeskTabs[existingTabId];
			state.zendeskTabs[sourceTabId] = {
				subdomain: match.subdomain,
				lastActive: Date.now(),
			};
			await saveState(state);
		}
	} else {
		// No existing tab, track this one
		state.zendeskTabs[sourceTabId] = {
			subdomain: match.subdomain,
			lastActive: Date.now(),
		};
		await saveState(state);
	}
}

/**
 * Track a tab as a Zendesk agent tab in state.
 *
 * @param tabId - Tab ID to track
 * @param url - Current URL of the tab
 */
async function trackTab(tabId: number, url: string): Promise<void> {
	const state = await loadState();

	// Extract subdomain from URL
	const match = matchZendeskUrl(url);
	if (!match) {
		// URL matched filter but not our routes - try parsing for subdomain directly
		try {
			const parsed = new URL(url);
			const subdomain = parsed.hostname.replace(".zendesk.com", "");
			if (subdomain && isZendeskAgentUrl(url)) {
				state.zendeskTabs[tabId] = {
					subdomain,
					lastActive: Date.now(),
				};
				await saveState(state);
			}
		} catch {
			// Invalid URL, ignore
		}
		return;
	}

	state.zendeskTabs[tabId] = {
		subdomain: match.subdomain,
		lastActive: Date.now(),
	};
	await saveState(state);
}

export default defineBackground(() => {
	// Console log for lifecycle debugging per CONTEXT.md
	console.log("QuickTab service worker started", { id: browser.runtime.id });

	// =================================================================
	// ALL EVENT LISTENERS REGISTERED SYNCHRONOUSLY AT MODULE SCOPE
	// Per RESEARCH.md: NO async in defineBackground signature
	// =================================================================

	/**
	 * Handle extension installation and updates
	 */
	chrome.runtime.onInstalled.addListener(async (details) => {
		if (details.reason === "install") {
			// Open welcome page on first install
			const welcomeUrl = chrome.runtime.getURL("welcome.html");
			await chrome.tabs.create({ url: welcomeUrl });
		}

		if (details.reason === "update") {
			// Reset state on extension update per CONTEXT.md (clean restart)
			await clearState();
			console.log("QuickTab: Extension updated - state reset");
		}

		// Re-detect existing Zendesk tabs after install/update
		const tabs = await queryZendeskTabs();
		if (tabs.length > 0) {
			const state = await loadState();
			for (const tab of tabs) {
				if (tab.id && tab.url) {
					const match = matchZendeskUrl(tab.url);
					if (match) {
						state.zendeskTabs[tab.id] = {
							subdomain: match.subdomain,
							lastActive: Date.now(),
						};
					} else if (isZendeskAgentUrl(tab.url)) {
						// Agent URL but not matching our routes - still track it
						try {
							const parsed = new URL(tab.url);
							const subdomain = parsed.hostname.replace(".zendesk.com", "");
							state.zendeskTabs[tab.id] = {
								subdomain,
								lastActive: Date.now(),
							};
						} catch {
							// Invalid URL, skip
						}
					}
				}
			}
			await saveState(state);
			console.log("QuickTab: Re-detected", tabs.length, "Zendesk tabs");
		}
	});

	/**
	 * Main navigation interception - fires before navigation starts
	 * Handles user-initiated navigation
	 */
	chrome.webNavigation.onBeforeNavigate.addListener(
		async (details) => {
			// Only handle main frame navigation
			if (details.frameId !== 0) return;

			const detection = await getUrlDetection();
			if (detection === "noUrls") return;

			const match = matchZendeskUrl(details.url);
			if (!match) return;

			// For ticketUrls mode, only intercept ticket routes
			if (detection === "ticketUrls" && match.type !== "ticket") return;

			await handleNavigation(details.tabId, details.url, match);
		},
		{ url: [{ hostSuffix: "zendesk.com" }] },
	);

	/**
	 * Backup navigation interception - fires after navigation commits
	 * Handles redirects and programmatic navigation
	 */
	chrome.webNavigation.onCommitted.addListener(
		async (details) => {
			// Only handle main frame navigation
			if (details.frameId !== 0) return;

			const detection = await getUrlDetection();
			if (detection === "noUrls") return;

			const match = matchZendeskUrl(details.url);
			if (!match) return;

			// For ticketUrls mode, only intercept ticket routes
			if (detection === "ticketUrls" && match.type !== "ticket") return;

			await handleNavigation(details.tabId, details.url, match);
		},
		{ url: [{ hostSuffix: "zendesk.com" }] },
	);

	/**
	 * Track Zendesk agent tabs when page loads
	 * Shows action icon and updates tab tracking state
	 */
	chrome.webNavigation.onDOMContentLoaded.addListener(
		async (details) => {
			// Only handle main frame
			if (details.frameId !== 0) return;

			// Track this tab
			await trackTab(details.tabId, details.url);

			// Enable action icon for this tab
			chrome.action.enable(details.tabId);
		},
		{ url: [{ urlContains: "zendesk.com/agent" }] },
	);
});

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

import {
	type AllStorageData,
	clearState,
	getUrlDetection,
	loadAll,
	loadState,
	saveState,
	setUrlDetection,
} from "@/src/utils/storage";
import { closeTab, focusTab, queryZendeskTabs, updateLotusRoute } from "@/src/utils/tabs";
import type { RouteMatch, UrlDetectionMode, ZendeskTabInfo } from "@/src/utils/types";
import { isZendeskAgentUrl, matchZendeskUrl } from "@/src/utils/url-matching";

/**
 * Deduplication: Track recently processed navigations to prevent double-firing.
 * Key: "tabId:url", Value: timestamp
 * NOTE: This in-memory state is acceptable per MV3 patterns because:
 * - It's only used for short-term deduplication (cleared after 1 second)
 * - Loss on service worker termination is acceptable (just means no dedup)
 * - Not persisted to storage (would add unnecessary latency)
 */
const recentNavigations = new Map<string, number>();
const NAVIGATION_DEDUPE_MS = 1000; // 1 second window for deduplication

/**
 * Message types for popup communication
 */
interface GetStatusMessage {
	type: "getStatus";
}

interface SetModeMessage {
	type: "setMode";
	mode: UrlDetectionMode;
}

type BackgroundMessage = GetStatusMessage | SetModeMessage;

interface GetStatusResponse {
	mode: UrlDetectionMode;
}

/**
 * Check if a navigation was recently processed (deduplication).
 * If not recently processed, marks it as processed and returns false.
 * If already processed within the dedupe window, returns true.
 *
 * @param tabId - Tab ID of the navigation
 * @param url - URL being navigated to
 * @returns true if this navigation should be skipped (already processed)
 */
function isDuplicateNavigation(tabId: number, url: string): boolean {
	const key = `${tabId}:${url}`;
	const now = Date.now();

	// Clean up old entries (older than dedupe window)
	for (const [k, timestamp] of recentNavigations.entries()) {
		if (now - timestamp > NAVIGATION_DEDUPE_MS) {
			recentNavigations.delete(k);
		}
	}

	// Check if recently processed
	const lastProcessed = recentNavigations.get(key);
	if (lastProcessed && now - lastProcessed < NAVIGATION_DEDUPE_MS) {
		return true; // Skip this duplicate
	}

	// Mark as processed
	recentNavigations.set(key, now);
	return false;
}

/**
 * Get the icon path for a given detection mode.
 *
 * @param mode - Current URL detection mode
 * @returns Path to the appropriate icon
 */
function getIconPath(mode: UrlDetectionMode): string {
	return mode !== "noUrls"
		? "/images/icons/icon38-enabled.png"
		: "/images/icons/icon38-disabled.png";
}

/**
 * Update action icon for a SINGLE tab based on detection mode.
 * Use this for individual tab updates (e.g., onDOMContentLoaded).
 *
 * This is optimized to minimize chrome.* API calls, which is critical
 * when DLP extensions (like Incydr) are monitoring API calls and adding latency.
 *
 * @param tabId - Tab ID to update
 * @param mode - Current URL detection mode
 */
async function setTabIcon(tabId: number, mode: UrlDetectionMode): Promise<void> {
	const iconPath = getIconPath(mode);
	try {
		await chrome.action.setIcon({ tabId, path: iconPath });
	} catch {
		// Tab may have closed, ignore
	}
}

/**
 * Update action icon for ALL Zendesk agent tabs based on detection mode.
 * Use this only when the mode changes (requires updating all tabs).
 *
 * Per existing behavior: enabled icon if mode !== 'noUrls', disabled otherwise.
 *
 * @param mode - Current URL detection mode
 */
async function setAllTabIcons(mode: UrlDetectionMode): Promise<void> {
	const iconPath = getIconPath(mode);

	// Query all Zendesk agent tabs and update their icons in parallel
	const tabs = await queryZendeskTabs();
	const tabIds = tabs.map((tab) => tab.id).filter((id): id is number => id !== undefined);
	await Promise.all(
		tabIds.map((tabId) =>
			chrome.action.setIcon({ tabId, path: iconPath }).catch(() => {
				// Tab may have closed, ignore
			}),
		),
	);
}

/**
 * Find the most recently active tab for a given subdomain from LIVE browser tabs.
 * Per CONTEXT.md: Multiple matching tabs use most recently active tab.
 *
 * CRITICAL: This queries LIVE tabs and validates they have /agent/* URLs,
 * matching the original extension behavior. The storage state is only used
 * for lastActive timestamps when multiple tabs match.
 *
 * @param subdomain - Zendesk subdomain to match
 * @param excludeTabId - Tab ID to exclude from search (the source tab)
 * @param zendeskTabs - Storage state for lastActive timestamps
 * @returns Tab object of most recently active tab, or null if none found
 */
async function findExistingAgentTab(
	subdomain: string,
	excludeTabId: number,
	zendeskTabs: Record<number, ZendeskTabInfo>,
): Promise<chrome.tabs.Tab | null> {
	// Query LIVE tabs matching this subdomain's agent interface
	// This matches original behavior: tabs.query('*://' + subdomain + '.zendesk.com/agent/*')
	const pattern = `*://${subdomain}.zendesk.com/agent/*`;
	const liveTabs = await chrome.tabs.query({ url: pattern });

	if (liveTabs.length === 0) {
		return null;
	}

	// Filter out the source tab and find the most recently active
	let bestTab: chrome.tabs.Tab | null = null;
	let bestTime = 0;

	for (const tab of liveTabs) {
		if (!tab.id || tab.id === excludeTabId) continue;
		if (!tab.url) continue;

		// Additional validation: URL must match agent interface pattern
		// (defensive check - query should already filter this)
		if (!isZendeskAgentUrl(tab.url)) continue;

		// Use storage state for lastActive timestamp if available, otherwise use 0
		const lastActive = zendeskTabs[tab.id]?.lastActive ?? 0;

		if (lastActive > bestTime || bestTab === null) {
			bestTime = lastActive;
			bestTab = tab;
		}
	}

	return bestTab;
}

/**
 * Handle navigation interception and tab routing.
 * Core routing logic matching original extension behavior:
 * 1. Query LIVE tabs for matching subdomain + /agent/* URL
 * 2. Find first matching tab (or most recently active if tracked)
 * 3. Update that tab's URL and focus it
 * 4. Close the source tab
 *
 * PERFORMANCE: Accepts pre-loaded state to avoid redundant storage reads.
 * The caller loads state once via loadAll() and passes it through.
 *
 * @param sourceTabId - Tab ID that initiated the navigation
 * @param sourceUrl - URL being navigated to
 * @param match - Matched route details
 * @param state - Pre-loaded storage state (to minimize API calls)
 */
async function handleNavigation(
	sourceTabId: number,
	_sourceUrl: string,
	match: RouteMatch,
	state: AllStorageData["state"],
): Promise<void> {
	// Find existing LIVE agent tab for this subdomain (not the source tab)
	const existingTab = await findExistingAgentTab(match.subdomain, sourceTabId, state.zendeskTabs);

	if (existingTab?.id) {
		// Route to existing tab via postMessage to Zendesk SPA
		// This avoids triggering browser navigation events (prevents cascade)
		const updated = await updateLotusRoute(existingTab.id, match.path);

		if (updated) {
			await focusTab(existingTab.id);
			await closeTab(sourceTabId);

			// Update lastActive for the target tab
			state.zendeskTabs[existingTab.id] = {
				subdomain: match.subdomain,
				lastActive: Date.now(),
			};

			// Remove source tab from tracking (it's now closed)
			delete state.zendeskTabs[sourceTabId];
			await saveState(state);
		}
		// If update failed, tab no longer exists - just let source tab continue
	} else {
		// No existing agent tab found, track this one as a new agent tab
		state.zendeskTabs[sourceTabId] = {
			subdomain: match.subdomain,
			lastActive: Date.now(),
		};
		await saveState(state);
	}
}

/**
 * Track a tab as a Zendesk agent tab using pre-loaded state.
 * PERFORMANCE: Accepts pre-loaded state to avoid redundant storage reads.
 *
 * @param tabId - Tab ID to track
 * @param url - Current URL of the tab
 * @param state - Pre-loaded storage state (to minimize API calls)
 */
async function trackTabWithState(
	tabId: number,
	url: string,
	state: AllStorageData["state"],
): Promise<void> {
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
	 * Navigation interception - matching original extension behavior exactly.
	 *
	 * The original uses BOTH onBeforeNavigate AND onCommitted, both calling
	 * the same handler. We use deduplication to prevent double-processing.
	 *
	 * NO transitionType filtering - the original doesn't filter.
	 * The key is that we only close the source tab IF we successfully
	 * route to a DIFFERENT existing agent tab.
	 */
	chrome.webNavigation.onBeforeNavigate.addListener(
		async (details) => {
			// Only handle main frame navigation
			if (details.frameId !== 0) return;

			// DEBUG: Log navigation details
			console.log("QuickTab onBeforeNavigate:", {
				url: details.url,
				tabId: details.tabId,
			});

			// Deduplication: Skip if we recently processed this exact navigation
			if (isDuplicateNavigation(details.tabId, details.url)) return;

			// PERFORMANCE: Load ALL storage data in ONE API call
			// This batches getUrlDetection + loadState into a single chrome.storage.local.get()
			const { mode, state } = await loadAll();
			if (mode === "noUrls") return;

			const match = matchZendeskUrl(details.url);
			if (!match) return;

			// For ticketUrls mode, only intercept ticket routes
			if (mode === "ticketUrls" && match.type !== "ticket") return;

			await handleNavigation(details.tabId, details.url, match, state);
		},
		{ url: [{ hostSuffix: "zendesk.com" }] },
	);

	/**
	 * Backup navigation handler - fires after navigation commits.
	 * Handles redirects and programmatic navigation.
	 * Same logic as onBeforeNavigate, deduplication prevents double-processing.
	 */
	chrome.webNavigation.onCommitted.addListener(
		async (details) => {
			// Only handle main frame navigation
			if (details.frameId !== 0) return;

			// DEBUG: Log navigation details
			console.log("QuickTab onCommitted:", {
				url: details.url,
				tabId: details.tabId,
				transitionType: details.transitionType,
			});

			// Deduplication: Skip if we recently processed this exact navigation
			if (isDuplicateNavigation(details.tabId, details.url)) return;

			// PERFORMANCE: Load ALL storage data in ONE API call
			const { mode, state } = await loadAll();
			if (mode === "noUrls") return;

			const match = matchZendeskUrl(details.url);
			if (!match) return;

			// For ticketUrls mode, only intercept ticket routes
			if (mode === "ticketUrls" && match.type !== "ticket") return;

			await handleNavigation(details.tabId, details.url, match, state);
		},
		{ url: [{ hostSuffix: "zendesk.com" }] },
	);

	/**
	 * Track Zendesk agent tabs when page loads
	 * Shows action icon and updates tab tracking state
	 *
	 * OPTIMIZATION: Only updates the SINGLE tab's icon instead of all tabs.
	 * This is critical for performance when DLP extensions (like Incydr) are
	 * monitoring chrome.* API calls - reduces O(N) to O(1) API calls per navigation.
	 *
	 * PERFORMANCE: Uses loadAll() to batch storage reads into single API call.
	 */
	chrome.webNavigation.onDOMContentLoaded.addListener(
		async (details) => {
			// Only handle main frame
			if (details.frameId !== 0) return;

			// PERFORMANCE: Load ALL storage data in ONE API call
			// This replaces: trackTab() + getUrlDetection() which was 3 separate reads
			const { mode, state } = await loadAll();

			// Track this tab (using pre-loaded state)
			await trackTabWithState(details.tabId, details.url, state);

			// Enable action icon for this tab
			chrome.action.enable(details.tabId);

			// Set icon state for THIS tab only (not all tabs)
			await setTabIcon(details.tabId, mode);
		},
		{ url: [{ urlContains: "zendesk.com/agent" }] },
	);

	/**
	 * Message handler for popup communication
	 * Handles getStatus and setMode messages
	 */
	chrome.runtime.onMessage.addListener(
		(
			message: BackgroundMessage,
			_sender: chrome.runtime.MessageSender,
			sendResponse: (response: GetStatusResponse | boolean) => void,
		) => {
			// Handle each message type
			if (message.type === "getStatus") {
				// Return current detection mode
				getUrlDetection()
					.then((mode) => {
						sendResponse({ mode });
					})
					.catch(() => {
						sendResponse({ mode: "allUrls" });
					});
				// Return true to indicate async response
				return true;
			}

			if (message.type === "setMode") {
				// Save new mode and update ALL tab icons (mode change affects all tabs)
				setUrlDetection(message.mode)
					.then(() => setAllTabIcons(message.mode))
					.then(() => {
						sendResponse(true);
					})
					.catch(() => {
						sendResponse(false);
					});
				// Return true to indicate async response
				return true;
			}

			// Unknown message type
			return false;
		},
	);
});

/**
 * Type-safe Chrome storage wrapper with storage-first architecture
 * Implements silent fallback on errors per CONTEXT.md
 */

import type { StorageSchema, UrlDetectionMode, ZendeskTabInfo } from "./types";

// DIAGNOSTIC TIMING - Remove after debugging
const DIAG_ENABLED = true;
const diagLog = (label: string, startTime: number) => {
	if (!DIAG_ENABLED) return;
	const elapsed = Math.round(performance.now() - startTime);
	console.log(`[DIAG] ${label}: ${elapsed}ms`);
};
const diagStart = () => performance.now();

/** Storage key for QuickTab state */
const STORAGE_KEY = "quicktab_state" as const;

/** Default state when storage is empty or unavailable */
const DEFAULT_STATE: StorageSchema["quicktab_state"] = {
	zendeskTabs: {},
};

/**
 * Load state from chrome.storage.local
 * Storage-first pattern: always load fresh state on each operation
 *
 * @returns Current state or DEFAULT_STATE on error
 */
export async function loadState(): Promise<StorageSchema["quicktab_state"]> {
	try {
		const result = await chrome.storage.local.get(STORAGE_KEY);
		return (result[STORAGE_KEY] as StorageSchema["quicktab_state"]) ?? DEFAULT_STATE;
	} catch (error) {
		// Silent fallback per CONTEXT.md - extension works but state won't survive restart
		console.warn("QuickTab: Storage read failed, using default state", error);
		return DEFAULT_STATE;
	}
}

/**
 * Save state to chrome.storage.local
 * Storage-first pattern: save immediately after modifications
 *
 * @param state - The state to persist
 */
export async function saveState(state: StorageSchema["quicktab_state"]): Promise<void> {
	try {
		const t1 = diagStart();
		await chrome.storage.local.set({ [STORAGE_KEY]: state });
		diagLog("saveState.storage.local.set", t1);
	} catch (error) {
		// Silent fallback per CONTEXT.md - no user-visible error
		console.warn("QuickTab: Storage write failed", error);
	}
}

/**
 * Get the current URL detection mode
 *
 * @returns Current mode or 'allUrls' as default
 */
export async function getUrlDetection(): Promise<UrlDetectionMode> {
	try {
		const result = await chrome.storage.local.get("urlDetection");
		return (result.urlDetection as UrlDetectionMode) ?? "allUrls";
	} catch (error) {
		console.warn("QuickTab: Failed to read URL detection mode", error);
		return "allUrls";
	}
}

/**
 * Set the URL detection mode
 *
 * @param mode - The detection mode to set
 */
export async function setUrlDetection(mode: UrlDetectionMode): Promise<void> {
	try {
		await chrome.storage.local.set({ urlDetection: mode });
	} catch (error) {
		console.warn("QuickTab: Failed to write URL detection mode", error);
	}
}

/**
 * Clear all QuickTab state from storage
 * Used on extension update per CONTEXT.md (clean restart)
 */
export async function clearState(): Promise<void> {
	try {
		await chrome.storage.local.remove(STORAGE_KEY);
	} catch (error) {
		console.warn("QuickTab: Failed to clear state", error);
	}
}

/**
 * Result of loading all storage data in a single call.
 * Used to minimize chrome.storage API calls which can be slow
 * when DLP extensions (like Incydr) are monitoring API usage.
 */
export interface AllStorageData {
	mode: UrlDetectionMode;
	state: StorageSchema["quicktab_state"];
}

/**
 * Load ALL QuickTab data in a SINGLE chrome.storage.local.get() call.
 *
 * PERFORMANCE CRITICAL: This batches what would be 2 separate API calls
 * (getUrlDetection + loadState) into 1 call. When DLP extensions add latency
 * to each chrome.* API call, this batching is essential for responsiveness.
 *
 * @returns Object containing both mode and state
 */
export async function loadAll(): Promise<AllStorageData> {
	try {
		const t1 = diagStart();
		const result = await chrome.storage.local.get(["urlDetection", STORAGE_KEY]);
		diagLog("loadAll.storage.local.get", t1);
		return {
			mode: (result.urlDetection as UrlDetectionMode) ?? "allUrls",
			state: (result[STORAGE_KEY] as StorageSchema["quicktab_state"]) ?? DEFAULT_STATE,
		};
	} catch (error) {
		console.warn("QuickTab: Storage read failed, using defaults", error);
		return {
			mode: "allUrls",
			state: DEFAULT_STATE,
		};
	}
}

// Re-export types for convenience
export type { ZendeskTabInfo, UrlDetectionMode, StorageSchema };

/**
 * Shared type definitions for QuickTab URL matching and storage
 */

/**
 * Type of Zendesk route that was matched.
 * - 'lotus': Agent interface routes (/agent/*)
 * - 'ticket': Ticket-specific routes (/tickets/*, /requests/*, etc.)
 */
export type RouteType = "lotus" | "ticket";

/**
 * Result of matching a Zendesk URL.
 * Contains the subdomain, normalized path, and route type.
 */
export interface RouteMatch {
	/** Zendesk subdomain (e.g., 'company1' from company1.zendesk.com) */
	subdomain: string;
	/** Normalized path within the agent interface */
	path: string;
	/** Type of route matched */
	type: RouteType;
}

/**
 * URL detection mode controlling which navigations to intercept.
 * - 'allUrls': Intercept all Zendesk agent URLs (lotus + ticket)
 * - 'ticketUrls': Intercept only ticket-related URLs
 * - 'noUrls': Disable URL interception entirely
 */
export type UrlDetectionMode = "allUrls" | "ticketUrls" | "noUrls";

/**
 * Information tracked for a Zendesk agent tab.
 * Used to determine routing targets and track activity.
 */
export interface ZendeskTabInfo {
	/** Zendesk subdomain this tab belongs to */
	subdomain: string;
	/** Timestamp of last activity (for "most recently active" selection) */
	lastActive: number;
}

/**
 * Schema for chrome.storage.local data structure.
 * Defines the shape of all persisted QuickTab state.
 */
export interface StorageSchema {
	/** Current URL detection mode setting */
	urlDetection: UrlDetectionMode;
	/** Persisted tab tracking state */
	quicktab_state: {
		/** Map of tab ID to tab info (uses Record for JSON serialization) */
		zendeskTabs: Record<number, ZendeskTabInfo>;
	};
}

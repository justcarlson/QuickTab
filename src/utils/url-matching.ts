/**
 * URL matching module for Zendesk agent URLs.
 * Ports legacy app/javascripts/modules/url_match.js to TypeScript.
 *
 * Per CONTEXT.md:
 * - Ignores query parameters and hash fragments
 * - Matches any Zendesk subdomain
 * - Unified matching for tickets, users, organizations
 */

import type { RouteMatch, RouteType } from "./types";

/**
 * Matches Zendesk agent interface routes (/agent/*)
 * Excludes chat and voice routes which are handled separately.
 * Captures the path after /agent/
 */
const LOTUS_ROUTE = /^\/agent\/(?!chat|voice)(.*)$/;

/**
 * Matches ticket-related routes from various Zendesk URL patterns.
 * Captures the ticket/request identifier.
 */
const TICKET_ROUTE = /^\/(?:agent\/tickets|tickets|twickets|requests|hc\/requests)\/(.*)$/;

/**
 * Restricted routes that should NOT be intercepted.
 * - agent/chat: Chat interface
 * - agent/talk: Voice interface
 * - agent/admin/voice: Voice admin
 * - tickets/{id}/print: Print view
 */
const RESTRICTED_ROUTE = /^\/(agent\/(chat|talk|admin\/voice)|tickets\/\d+\/print)/;

/** Zendesk domain suffix for URL validation */
const ZENDESK_DOMAIN_SUFFIX = ".zendesk.com";

/**
 * Match a URL against Zendesk routing patterns.
 *
 * @param urlString - Full URL to match
 * @returns RouteMatch if URL matches a Zendesk route, null otherwise
 *
 * @example
 * matchZendeskUrl('https://company.zendesk.com/agent/tickets/123')
 * // => { subdomain: 'company', path: '/tickets/123', type: 'ticket' }
 *
 * matchZendeskUrl('https://company.zendesk.com/agent/chat')
 * // => null (restricted route)
 */
export function matchZendeskUrl(urlString: string): RouteMatch | null {
	let url: URL;
	try {
		url = new URL(urlString);
	} catch {
		return null; // Invalid URL
	}

	// Verify zendesk.com domain (any subdomain)
	if (!url.hostname.endsWith(ZENDESK_DOMAIN_SUFFIX)) {
		return null;
	}

	// Extract subdomain (everything before .zendesk.com)
	const subdomain = url.hostname.slice(0, -ZENDESK_DOMAIN_SUFFIX.length);
	if (!subdomain) {
		return null; // Root domain without subdomain
	}

	// Use pathname only - ignores query params and hash per CONTEXT.md
	const pathname = url.pathname;

	// Check restricted routes first (chat, voice, print)
	if (RESTRICTED_ROUTE.test(pathname)) {
		return null;
	}

	// Try ticket route (higher priority per existing logic)
	const ticketMatch = pathname.match(TICKET_ROUTE);
	if (ticketMatch) {
		const path = ticketMatch[1]?.replace("#/", "") ?? "";
		return { subdomain, path: `/tickets/${path}`, type: "ticket" as RouteType };
	}

	// Try lotus route
	const lotusMatch = pathname.match(LOTUS_ROUTE);
	if (lotusMatch) {
		const path = lotusMatch[1]?.replace("#/", "") ?? "";
		return { subdomain, path: `/${path}`, type: "lotus" as RouteType };
	}

	return null;
}

/**
 * Build a Zendesk agent URL from a RouteMatch.
 *
 * @param match - RouteMatch containing subdomain and path
 * @returns Full Zendesk agent URL
 *
 * @example
 * buildZendeskUrl({ subdomain: 'company', path: '/tickets/123', type: 'ticket' })
 * // => 'https://company.zendesk.com/agent/tickets/123'
 */
export function buildZendeskUrl(match: RouteMatch): string {
	return `https://${match.subdomain}${ZENDESK_DOMAIN_SUFFIX}/agent${match.path}`;
}

/**
 * Check if a URL is a Zendesk agent URL.
 *
 * @param url - URL string to check
 * @returns true if URL is a Zendesk agent interface URL
 *
 * @example
 * isZendeskAgentUrl('https://company.zendesk.com/agent/dashboard')
 * // => true
 *
 * isZendeskAgentUrl('https://company.zendesk.com/hc/articles/123')
 * // => false
 */
export function isZendeskAgentUrl(url: string): boolean {
	try {
		const parsed = new URL(url);
		return parsed.hostname.endsWith(ZENDESK_DOMAIN_SUFFIX) && parsed.pathname.startsWith("/agent");
	} catch {
		return false;
	}
}

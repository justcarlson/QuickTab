import { describe, expect, it } from "vitest";
import type { RouteMatch } from "./types";
import { buildZendeskUrl, isZendeskAgentUrl, matchZendeskUrl } from "./url-matching";

describe("matchZendeskUrl", () => {
	describe("valid Zendesk URLs", () => {
		it("matches agent ticket URL and extracts subdomain/path", () => {
			const result = matchZendeskUrl("https://company.zendesk.com/agent/tickets/123");
			expect(result).toEqual({
				subdomain: "company",
				path: "/tickets/123",
				type: "ticket",
			});
		});

		it("matches lotus route (agent dashboard)", () => {
			const result = matchZendeskUrl("https://company.zendesk.com/agent/dashboard");
			expect(result).toEqual({
				subdomain: "company",
				path: "/dashboard",
				type: "lotus",
			});
		});

		it("matches /tickets/ route (non-agent path)", () => {
			const result = matchZendeskUrl("https://company.zendesk.com/tickets/456");
			expect(result).toEqual({
				subdomain: "company",
				path: "/tickets/456",
				type: "ticket",
			});
		});

		it("matches /requests/ route", () => {
			const result = matchZendeskUrl("https://company.zendesk.com/requests/789");
			expect(result).toEqual({
				subdomain: "company",
				path: "/tickets/789",
				type: "ticket",
			});
		});

		it("matches /twickets/ route", () => {
			const result = matchZendeskUrl("https://company.zendesk.com/twickets/101");
			expect(result).toEqual({
				subdomain: "company",
				path: "/tickets/101",
				type: "ticket",
			});
		});

		it("matches /hc/requests/ route", () => {
			const result = matchZendeskUrl("https://company.zendesk.com/hc/requests/202");
			expect(result).toEqual({
				subdomain: "company",
				path: "/tickets/202",
				type: "ticket",
			});
		});

		it("ignores query params", () => {
			const result = matchZendeskUrl(
				"https://company.zendesk.com/agent/tickets/123?foo=bar&baz=qux",
			);
			expect(result).toEqual({
				subdomain: "company",
				path: "/tickets/123",
				type: "ticket",
			});
		});

		it("ignores hash fragments", () => {
			const result = matchZendeskUrl("https://company.zendesk.com/agent/tickets/123#section");
			expect(result).toEqual({
				subdomain: "company",
				path: "/tickets/123",
				type: "ticket",
			});
		});

		it("handles multi-level subdomain", () => {
			const result = matchZendeskUrl("https://sub.company.zendesk.com/agent/tickets/123");
			expect(result).toEqual({
				subdomain: "sub.company",
				path: "/tickets/123",
				type: "ticket",
			});
		});

		it("matches agent users route as lotus", () => {
			const result = matchZendeskUrl("https://company.zendesk.com/agent/users/12345");
			expect(result).toEqual({
				subdomain: "company",
				path: "/users/12345",
				type: "lotus",
			});
		});

		it("matches agent organizations route as lotus", () => {
			const result = matchZendeskUrl("https://company.zendesk.com/agent/organizations/67890");
			expect(result).toEqual({
				subdomain: "company",
				path: "/organizations/67890",
				type: "lotus",
			});
		});
	});

	describe("restricted routes (return null)", () => {
		it("returns null for chat route", () => {
			const result = matchZendeskUrl("https://company.zendesk.com/agent/chat");
			expect(result).toBeNull();
		});

		it("returns null for chat route with subpath", () => {
			const result = matchZendeskUrl("https://company.zendesk.com/agent/chat/123");
			expect(result).toBeNull();
		});

		it("returns null for talk/voice route", () => {
			const result = matchZendeskUrl("https://company.zendesk.com/agent/talk");
			expect(result).toBeNull();
		});

		it("returns null for voice admin route", () => {
			const result = matchZendeskUrl("https://company.zendesk.com/agent/admin/voice");
			expect(result).toBeNull();
		});

		it("returns null for print view", () => {
			const result = matchZendeskUrl("https://company.zendesk.com/tickets/123/print");
			expect(result).toBeNull();
		});
	});

	describe("invalid URLs (return null)", () => {
		it("returns null for non-Zendesk domain", () => {
			const result = matchZendeskUrl("https://example.com/agent/tickets/123");
			expect(result).toBeNull();
		});

		it("returns null for root zendesk.com (no subdomain)", () => {
			const result = matchZendeskUrl("https://zendesk.com/agent/tickets/123");
			expect(result).toBeNull();
		});

		it("returns null for malformed URL", () => {
			const result = matchZendeskUrl("not-a-valid-url");
			expect(result).toBeNull();
		});

		it("returns null for empty string", () => {
			const result = matchZendeskUrl("");
			expect(result).toBeNull();
		});

		it("returns null for help center articles URL", () => {
			const result = matchZendeskUrl("https://company.zendesk.com/hc/articles/123456");
			expect(result).toBeNull();
		});

		it("returns null for root path", () => {
			const result = matchZendeskUrl("https://company.zendesk.com/");
			expect(result).toBeNull();
		});

		it("returns null for non-agent non-ticket paths", () => {
			const result = matchZendeskUrl("https://company.zendesk.com/admin/settings");
			expect(result).toBeNull();
		});
	});
});

describe("buildZendeskUrl", () => {
	it("constructs correct agent URL from ticket RouteMatch", () => {
		const match: RouteMatch = {
			subdomain: "company",
			path: "/tickets/123",
			type: "ticket",
		};
		const url = buildZendeskUrl(match);
		expect(url).toBe("https://company.zendesk.com/agent/tickets/123");
	});

	it("constructs correct agent URL from lotus RouteMatch", () => {
		const match: RouteMatch = {
			subdomain: "company",
			path: "/dashboard",
			type: "lotus",
		};
		const url = buildZendeskUrl(match);
		expect(url).toBe("https://company.zendesk.com/agent/dashboard");
	});

	it("handles multi-level subdomain", () => {
		const match: RouteMatch = {
			subdomain: "sub.company",
			path: "/tickets/456",
			type: "ticket",
		};
		const url = buildZendeskUrl(match);
		expect(url).toBe("https://sub.company.zendesk.com/agent/tickets/456");
	});

	it("handles empty path", () => {
		const match: RouteMatch = {
			subdomain: "company",
			path: "",
			type: "lotus",
		};
		const url = buildZendeskUrl(match);
		expect(url).toBe("https://company.zendesk.com/agent");
	});
});

describe("isZendeskAgentUrl", () => {
	describe("returns true for agent URLs", () => {
		it("returns true for agent dashboard", () => {
			expect(isZendeskAgentUrl("https://company.zendesk.com/agent/dashboard")).toBe(true);
		});

		it("returns true for agent tickets", () => {
			expect(isZendeskAgentUrl("https://company.zendesk.com/agent/tickets/123")).toBe(true);
		});

		it("returns true for agent root", () => {
			expect(isZendeskAgentUrl("https://company.zendesk.com/agent")).toBe(true);
		});

		it("returns true for agent root with trailing slash", () => {
			expect(isZendeskAgentUrl("https://company.zendesk.com/agent/")).toBe(true);
		});

		it("returns true for agent chat (even though restricted for matching)", () => {
			// Note: isZendeskAgentUrl checks if it's an agent URL, not if it's matchable
			expect(isZendeskAgentUrl("https://company.zendesk.com/agent/chat")).toBe(true);
		});
	});

	describe("returns false for non-agent URLs", () => {
		it("returns false for help center URL", () => {
			expect(isZendeskAgentUrl("https://company.zendesk.com/hc/articles/123")).toBe(false);
		});

		it("returns false for tickets URL (non-agent path)", () => {
			expect(isZendeskAgentUrl("https://company.zendesk.com/tickets/123")).toBe(false);
		});

		it("returns false for root URL", () => {
			expect(isZendeskAgentUrl("https://company.zendesk.com/")).toBe(false);
		});

		it("returns false for admin URL", () => {
			expect(isZendeskAgentUrl("https://company.zendesk.com/admin")).toBe(false);
		});
	});

	describe("returns false for non-Zendesk domains", () => {
		it("returns false for example.com with agent path", () => {
			expect(isZendeskAgentUrl("https://example.com/agent/dashboard")).toBe(false);
		});

		it("returns false for zendesk.io domain", () => {
			expect(isZendeskAgentUrl("https://company.zendesk.io/agent/dashboard")).toBe(false);
		});
	});

	describe("returns false for malformed URLs", () => {
		it("returns false for invalid URL", () => {
			expect(isZendeskAgentUrl("not-a-url")).toBe(false);
		});

		it("returns false for empty string", () => {
			expect(isZendeskAgentUrl("")).toBe(false);
		});

		it("returns false for URL without protocol", () => {
			expect(isZendeskAgentUrl("company.zendesk.com/agent")).toBe(false);
		});
	});
});

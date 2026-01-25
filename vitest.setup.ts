/**
 * Global Vitest setup - runs before each test file
 *
 * Per RESEARCH.md Pattern 2: Reset fake-browser state between tests
 * to prevent state leakage causing flaky tests.
 */

import { beforeEach, vi } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";

beforeEach(() => {
	// Reset all fake-browser state (storage, tabs, etc.)
	fakeBrowser.reset();
	// Clear all Vitest mocks
	vi.clearAllMocks();
});

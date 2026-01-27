/**
 * QuickTab Welcome Page
 *
 * Populates i18n strings for the welcome page content.
 * Shown to users on first install.
 */

// DIAGNOSTIC: Capture script start time immediately
const WELCOME_SCRIPT_START = performance.now();
console.log("[DIAG] welcome script started");

const diagLog = (label: string, startTime: number) => {
	const elapsed = Math.round(performance.now() - startTime);
	console.log(`[DIAG] ${label}: ${elapsed}ms`);
};

/**
 * Get localized string with fallback to key name.
 */
function t(key: string): string {
	return chrome.i18n.getMessage(key) || `[${key}]`;
}

/**
 * Safely set text content on an element by ID.
 * Silently skips if element not found.
 */
function setText(id: string, text: string): void {
	const element = document.getElementById(id);
	if (element) {
		element.textContent = text;
	}
}

/**
 * Populate all i18n strings on the welcome page.
 */
function populateI18n(): void {
	// Hero section
	setText("thank-you", t("txt_welcome_header_thank_you"));
	setText("headline", t("txt_welcome_header_main"));
	setText("hook", t("txt_welcome_header_hook"));

	// FAQ cards
	setText("faq-1-title", t("txt_welcome_header_what_do"));
	setText("faq-1-body", t("txt_welcome_body_what_do"));

	setText("faq-2-title", t("txt_welcome_header_new_browser_tab"));
	setText("faq-2-body", t("txt_welcome_body_new_browser_tab"));

	setText("faq-3-title", t("txt_welcome_header_lose_work"));
	setText("faq-3-body", t("txt_welcome_body_lose_work"));

	setText("faq-4-title", t("txt_welcome_header_what_links"));
	setText("faq-4-body", t("txt_welcome_body_what_links"));

	// CTA button
	setText("cta-button", t("txt_welcome_button_read_docs"));
}

/**
 * Initialize welcome page on DOM ready.
 */
document.addEventListener("DOMContentLoaded", () => {
	diagLog("welcome DOMContentLoaded (from script start)", WELCOME_SCRIPT_START);
	const t0 = performance.now();
	populateI18n();
	diagLog("welcome populateI18n", t0);
	diagLog("welcome DOMContentLoaded.TOTAL", t0);
});

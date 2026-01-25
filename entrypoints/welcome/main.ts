/**
 * QuickTab Welcome Page
 *
 * Populates i18n strings for the welcome page content.
 * Shown to users on first install.
 */

/**
 * Get localized string with fallback to key name.
 */
function t(key: string): string {
	return chrome.i18n.getMessage(key) || `[${key}]`;
}

/**
 * Populate all i18n strings on the welcome page.
 */
function populateI18n(): void {
	// Hero section
	document.getElementById("thank-you")!.textContent = t("txt_welcome_header_thank_you");
	document.getElementById("headline")!.textContent = t("txt_welcome_header_main");
	document.getElementById("hook")!.textContent = t("txt_welcome_header_hook");

	// FAQ cards
	document.getElementById("faq-1-title")!.textContent = t("txt_welcome_header_what_do");
	document.getElementById("faq-1-body")!.textContent = t("txt_welcome_body_what_do");

	document.getElementById("faq-2-title")!.textContent = t("txt_welcome_header_new_browser_tab");
	document.getElementById("faq-2-body")!.textContent = t("txt_welcome_body_new_browser_tab");

	document.getElementById("faq-3-title")!.textContent = t("txt_welcome_header_lose_work");
	document.getElementById("faq-3-body")!.textContent = t("txt_welcome_body_lose_work");

	document.getElementById("faq-4-title")!.textContent = t("txt_welcome_header_what_links");
	document.getElementById("faq-4-body")!.textContent = t("txt_welcome_body_what_links");

	// CTA button
	document.getElementById("cta-button")!.textContent = t("txt_welcome_button_read_docs");
}

/**
 * Initialize welcome page on DOM ready.
 */
document.addEventListener("DOMContentLoaded", () => {
	populateI18n();
});

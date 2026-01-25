/**
 * QuickTab Popup
 *
 * Displays current detection mode and allows toggling between modes.
 * Communicates with background service worker via chrome.runtime.sendMessage.
 */

import type { UrlDetectionMode } from "@/src/utils/types";

interface GetStatusResponse {
	mode: UrlDetectionMode;
}

/**
 * Get localized string with fallback to key name.
 */
function t(key: string): string {
	return chrome.i18n.getMessage(key) || `[${key}]`;
}

/**
 * Request current mode from background service worker.
 */
async function getStatus(): Promise<UrlDetectionMode> {
	const response = await chrome.runtime.sendMessage({ type: "getStatus" });
	return (response as GetStatusResponse).mode;
}

/**
 * Send mode change to background service worker.
 */
async function setMode(mode: UrlDetectionMode): Promise<void> {
	await chrome.runtime.sendMessage({ type: "setMode", mode });
}

/**
 * Update radio button selection to match current mode.
 */
function updateModeUI(currentMode: UrlDetectionMode): void {
	const radios = document.querySelectorAll<HTMLInputElement>('input[name="detection-mode"]');
	radios.forEach((radio) => {
		radio.checked = radio.value === currentMode;
	});
}

/**
 * Populate all i18n strings in the popup.
 */
function populateI18n(): void {
	// Section headings
	const modeHeading = document.getElementById("mode-heading");
	if (modeHeading) {
		modeHeading.textContent = t("txt_popup_title_link_detection");
	}

	const helpHeading = document.getElementById("help-heading");
	if (helpHeading) {
		helpHeading.textContent = t("txt_popup_title_help");
	}

	// Mode labels
	const labelAllUrls = document.getElementById("label-allUrls");
	if (labelAllUrls) {
		labelAllUrls.textContent = t("txt_popup_options_link_detection_allLinks");
	}

	const labelTicketUrls = document.getElementById("label-ticketUrls");
	if (labelTicketUrls) {
		labelTicketUrls.textContent = t("txt_popup_options_link_detection_ticketLinks");
	}

	const labelNoUrls = document.getElementById("label-noUrls");
	if (labelNoUrls) {
		labelNoUrls.textContent = t("txt_popup_options_link_detection_noLinks");
	}

	// Help links
	const linkDocs = document.getElementById("link-docs");
	if (linkDocs) {
		linkDocs.textContent = t("txt_popup_options_help_documentation");
	}

	const linkWelcome = document.getElementById("link-welcome");
	if (linkWelcome) {
		linkWelcome.textContent = t("txt_popup_options_help_welcome");
	}
}

/**
 * Initialize popup on DOM ready.
 */
document.addEventListener("DOMContentLoaded", async () => {
	// Populate i18n strings first (while loading)
	populateI18n();

	try {
		// Load current mode from background
		const currentMode = await getStatus();
		updateModeUI(currentMode);
	} catch (error) {
		// Silent fallback - default to allUrls on error
		console.warn("QuickTab: Failed to get status", error);
		updateModeUI("allUrls");
	}

	// Remove loading state
	const app = document.getElementById("app");
	if (app) {
		app.classList.remove("loading");
	}

	// Bind mode change handlers
	document.querySelectorAll<HTMLInputElement>('input[name="detection-mode"]').forEach((radio) => {
		radio.addEventListener("change", async () => {
			if (radio.checked) {
				try {
					await setMode(radio.value as UrlDetectionMode);
				} catch (error) {
					// Silent fallback - log but don't show error to user
					console.warn("QuickTab: Failed to set mode", error);
				}
			}
		});
	});

	// Bind welcome page link
	const linkWelcome = document.getElementById("link-welcome");
	if (linkWelcome) {
		linkWelcome.addEventListener("click", (e) => {
			e.preventDefault();
			const welcomeUrl = chrome.runtime.getURL("welcome.html");
			chrome.tabs.create({ url: welcomeUrl });
		});
	}
});

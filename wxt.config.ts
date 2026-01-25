import { defineConfig } from "wxt";

export default defineConfig({
	manifest: {
		name: "__MSG_appName__",
		description: "__MSG_appDescription__",
		permissions: ["webNavigation", "tabs", "scripting", "storage"],
		host_permissions: ["http://*.zendesk.com/*", "https://*.zendesk.com/*"],
		icons: {
			16: "images/icons/icon-16.png",
			48: "images/icons/icon-48.png",
			128: "images/icons/icon-128.png",
		},
		default_locale: "en",
	},
	vite: () => ({
		build: {
			sourcemap: true,
		},
	}),
});

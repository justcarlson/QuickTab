import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Zendesk Quicktab',
    description: 'Well behaved browser tabs for Zendesk agents',
    permissions: ['webNavigation', 'tabs', 'scripting', 'storage'],
    host_permissions: ['http://*.zendesk.com/*', 'https://*.zendesk.com/*'],
  },
  vite: () => ({
    build: {
      sourcemap: true,
    },
  }),
});

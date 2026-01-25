export default defineBackground(() => {
  console.log('QuickTab background loaded', { id: browser.runtime.id });
});

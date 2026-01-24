var pageAction = {
  show: function(tabId) {
    chrome.action.enable(tabId);
  },

  setIcon: function(option) {
    var icon = '/images/icons/icon38-' + option + '.png';

    chrome.tabs.query({ url: '*://*.zendesk.com/agent/*' }, function(openTabs) {
      openTabs.forEach(function(tab) {
        chrome.action.setIcon({ tabId: tab.id, path: icon });
      });
    });
  }
};

module.exports = pageAction;

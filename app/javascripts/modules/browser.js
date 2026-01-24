var urlMatch = require('./url_match.js');

var browser = {

  tabs:       require('../browser/tabs.js'),
  pageAction: require('../browser/page_action.js'),
  i18n:       require('../browser/i18n.js'),
  storage:    require('../browser/storage.js'),
  extension:  require('../browser/extension.js'),

  addPageAction: function(tabId) {
    var self = this;

    this.storage.get('urlDetection', function(detectionMode) {
      var mode = detectionMode || 'allUrls',
          iconState = (mode !== 'noUrls') ? 'enabled' : 'disabled';

      self.pageAction.show(tabId);
      self.pageAction.setIcon(iconState);
    });
  },

  didNavigate: function(navDetails) {
    var tabDetails = { id: navDetails.tabId, url: navDetails.url };

    this.storage.get('urlDetection', function(detectionMode) {
      var mode = detectionMode || 'allUrls',
          zdUrlMatches = urlMatch.extractMatches(navDetails.url, mode);

      if ((mode !== 'noUrls') && zdUrlMatches) {
        tabDetails.routeDetails = zdUrlMatches;
        browser.openRouteInZendesk(tabDetails);
      }
    });
  },

  didInstall: function(details) {
    var self = this;

    // Find any tabs where the agent interface is open
    self.tabs.query('*://*.zendesk.com/agent/*', function(openTabs) {
      openTabs.forEach(function(tab) {
        self.addPageAction(tab.id);
      });
    });

    // Check if this was first time install
    if (details.reason === 'install') {
      self.openWelcome();
    }

    // Check if the settings we expect exist and set them if not
    self.storage.sanitize();
  },

  openRouteInZendesk: function(tab) {
    var subdomain  = tab.routeDetails.subdomain,
        route      = tab.routeDetails.path,
        self       = this;

    self.tabs.query('*://' + subdomain + '.zendesk.com/agent/*', function(openTabs) {
      var lotusTab = null;

      for (var i = 0, len = openTabs.length; i < len; i++) {
        lotusTab = openTabs[i];

        if (lotusTab.id !== tab.id && lotusTab.url.match(urlMatch.LOTUS_ROUTE)) {
          self.updateLotusRoute(lotusTab.id, route);
          self.tabs.focus(lotusTab);
          self.tabs.remove(tab.id);

          break;
        }
      }
    });
  },

  updateLotusRoute: function(lotusTabId, route) {
    var message = { "target": "route", "memo": { "hash": route } },
        serializedMessage = JSON.stringify(message);

    this.tabs.executeScript(lotusTabId, function(payload) {
      window.postMessage(payload, '*');
    }, [serializedMessage]);
  },

  openWelcome: function() {
    var welcomeUrl = this.extension.getUrl('welcome.html');

    this.tabs.create(welcomeUrl);
  }

};

module.exports = browser;

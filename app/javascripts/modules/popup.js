var templates = require('./templates.js'),
    browser   = require('./browser.js');

var popup = {

  init: function() {
    var self = this;

    browser.storage.get('disabledFor', function(disabledFor) {
      browser.storage.get('urlDetection', function(urlDetection) {
        templates.setSetting('urlDetection', urlDetection || 'allUrls');
        templates.show('popup', { disabledDuration: disabledFor }, $("body"));
        self.bindings();
      });
    });
  },

  bindings: function() {
    var self = this;

    $("a").blur();
    $("#settings-url-types a").click(function() {
      var urlType = $(this).data('url-type');

      self.setUrlDetection(urlType);
    });

    $("#settings-help-welcome").click(function() {
      browser.openWelcome();
    });
  },

  disable: function(disableFor) {
    browser.pageAction.setIcon('disabled');
    this.closePopup();
  },

  enable: function() {
    browser.pageAction.setIcon('enabled');
    this.closePopup();
  },

  setUrlDetection: function(option) {
    var self = this;

    browser.storage.set('urlDetection', option);

    switch(option) {
      case 'allUrls':
      case 'ticketUrls':
        self.enable();
        break;
      case 'noUrls':
        self.disable();
    }
  },

  closePopup: function() {
    window.close();
  }
};

module.exports = popup;

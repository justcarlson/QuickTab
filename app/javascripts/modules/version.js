var browser = require('./browser.js'),
    Package  = require('json!../../../package.json');

var version = {

  CURRENT: Package.version,

  set: function() {
    browser.storage.set('currentversion', this.CURRENT);
  },

  hasUpdated: function(callback) {
    var self = this;

    browser.storage.get('currentversion', function(storedVersion) {
      var hasUpdated = (self.CURRENT < storedVersion) ? true : false;

      if (callback) {
        callback(hasUpdated);
      }
    });
  },

  check: function() {
    var self = this;

    browser.storage.get('currentversion', function(storedVersion) {
      if (!storedVersion) {
        self.panic();
      }
    });
  },

  panic: function() {
    var self = this;

    browser.storage.drop(function() {
      self.set();
    });
  }

};

version.check();

module.exports = version;

var storage = {
  get: function(key, callback) {
    chrome.storage.local.get([key], function(result) {
      if (callback) {
        callback(result[key]);
      }
    });
  },

  set: function(key, value, callback) {
    if (value) {
      var payload = {};
      payload[key] = value;

      chrome.storage.local.set(payload, function() {
        if (callback) {
          callback();
        }
      });
    } else {
      chrome.storage.local.remove([key], function() {
        if (callback) {
          callback();
        }
      });
    }
  },

  drop: function(callback) {
    chrome.storage.local.clear(function() {
      if (callback) {
        callback();
      }
    });
  },

  sanitize: function(callback) {
    var self = this;

    self.get('urlDetection', function(value) {
      if (!value) {
        self.set('urlDetection', 'allUrls', callback);
      } else if (callback) {
        callback();
      }
    });
  }
};

module.exports = storage;

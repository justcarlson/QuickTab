var hasChromeStorage = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

var storage = {
  get: function(key, callback) {
    if (hasChromeStorage) {
      chrome.storage.local.get([key], function(result) {
        if (callback) {
          callback(result[key]);
        }
      });
      return;
    }

    var value = null;

    if (typeof localStorage !== 'undefined') {
      value = localStorage.getItem(key);
    }

    if (value) {
      try {
        value = JSON.parse(value);
      } catch (error) {
        // keep raw string
      }
    }

    if (callback) {
      callback(value || null);
    }
  },

  set: function(key, value, callback) {
    if (hasChromeStorage) {
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
      return;
    }

    if (typeof localStorage !== 'undefined') {
      if (value) {
        var storedValue = value;

        if (typeof value !== 'string') {
          storedValue = JSON.stringify(value);
        }

        localStorage.setItem(key, storedValue);
      } else {
        localStorage.removeItem(key);
      }
    }

    if (callback) {
      callback();
    }
  },

  drop: function(callback) {
    if (hasChromeStorage) {
      chrome.storage.local.clear(function() {
        if (callback) {
          callback();
        }
      });
      return;
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }

    if (callback) {
      callback();
    }
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

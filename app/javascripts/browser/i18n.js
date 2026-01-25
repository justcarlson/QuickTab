var fallbackMessages = null;

var i18n = {
  getString: function(key) {
    if (typeof chrome !== 'undefined' && chrome.i18n && typeof chrome.i18n.getMessage === 'function') {
      return chrome.i18n.getMessage(key) || "String not found: " + key;
    }

    if (!fallbackMessages) {
      fallbackMessages = {};

      try {
        var request = new XMLHttpRequest();
        request.open('GET', '/_locales/en/messages.json', false);
        request.send(null);

        if (request.status === 200 || request.status === 0) {
          fallbackMessages = JSON.parse(request.responseText);
        }
      } catch (error) {
        fallbackMessages = {};
      }
    }

    if (fallbackMessages[key] && fallbackMessages[key].message) {
      return fallbackMessages[key].message;
    }

    return "String not found: " + key;
  }
}

module.exports = i18n;

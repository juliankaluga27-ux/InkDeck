(function () {
  'use strict';
  if (!window.webkit || !window.webkit.messageHandlers.inkdeckNetwork) return;
  var OriginalXHR = window.XMLHttpRequest, nextID = 0, pending = {};
  var endpoints = [
    'https://multiplicatingkid.pl/multiplayerinkdeck/api.php',
    'https://api.openai.com/v1/responses',
    'https://api.openai.com/v1/models',
    'https://openrouter.ai/api/v1/models',
    'https://openrouter.ai/api/v1/chat/completions',
    'https://generativelanguage.googleapis.com/v1beta/interactions'
  ];
  window.InkDeckNative = { complete: function (id, status, text, error) {
    var xhr = pending[id];
    if (!xhr) return;
    delete pending[id];
    xhr.status = status; xhr.responseText = text; xhr.readyState = 4;
    if (xhr.onreadystatechange) xhr.onreadystatechange();
    if (error && xhr[error === 'timeout' ? 'ontimeout' : 'onerror']) xhr[error === 'timeout' ? 'ontimeout' : 'onerror']();
    if (!error && xhr.onload) xhr.onload();
  }};
  function XHR() { this.headers = {}; this.readyState = 0; this.status = 0; this.responseText = ''; this.timeout = 15000; }
  XHR.prototype.open = function (method, url, async) {
    this.method = method.toUpperCase(); this.url = url;
    var nativeURL=endpoints.indexOf(url)>=0 || /^https:\/\/generativelanguage\.googleapis\.com\/v1beta\/(models(?:\?(?:pageSize|pageToken)=[^#]*)?|models\/[A-Za-z0-9._-]+:generateContent)$/.test(url);
    if (!nativeURL) {
      this.original = new OriginalXHR();
      var self = this;
      ['readystatechange', 'error', 'timeout', 'load'].forEach(function (event) {
        self.original.addEventListener(event, function () {
          ['readyState', 'status', 'responseText'].forEach(function (key) { self[key] = self.original[key]; });
          if (self['on' + event]) self['on' + event]();
        });
      });
      this.original.open(method, url, async !== false);
    }
    this.readyState = 1;
  };
  XHR.prototype.setRequestHeader = function (key, value) {
    if (this.original) this.original.setRequestHeader(key, value); else this.headers[key] = value;
  };
  XHR.prototype.send = function (body) {
    if (this.original) { this.original.timeout = this.timeout; this.original.send(body); return; }
    this.id = ++nextID; pending[this.id] = this;
    window.webkit.messageHandlers.inkdeckNetwork.postMessage({id: this.id, method: this.method,
      url: this.url, headers: this.headers, body: body || '', timeout: this.timeout});
  };
  XHR.prototype.abort = function () {
    if (this.original) this.original.abort();
    delete pending[this.id]; this.readyState = 0;
  };
  window.XMLHttpRequest = XHR;
}());

var dotty = require('dotty');

var BaseModel = require('./base-model');

function Lance(opts) {
  if(!(this instanceof Lance)) {
    return new Lance(opts);
  }

  if(!opts || !opts.baseUrl) {
    throw new Error('baseUrl Missing.');
  }

  this._baseUrl = opts.baseUrl;
  this._rootPath = opts.rootPath || '/';
  this._modelMap = opts._modelMap || {};
  this._url = this._baseUrl + this._rootPath;
}

var proto = Lance.prototype;

proto.initialize = function() {
  var self = this;

  return fetch(self.url)
    .then(function(response) {
      return response.json();
    })
    .then(function(json) {
      self._metaModel = json;
    });
}

proto.metaModel = function() {
  return this._metaModel;
}

proto.fetch = function(linkName, data, opts) {
  var self = this;
  return fetch({
    method: 'get',
    url: self._url + linkName,
    headers: opts.headers || {}
  })
    .then(function(data) {
      data = data.json();
      if(typeof self._modelMap[linkName] === 'function') {
        return new self._modelMap[linkName](data);
      } else {
        return new BaseModel(data);
      }
    });
}

proto.create = function(linkName, data) {
  var self = this;
  return fetch({
    method: 'post',
    url: self._url + linkName
  });
}

module.exports = Lance;
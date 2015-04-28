var dotty = require('dotty');
var template = require('string-template');

var BaseModel = require('./base-model');

function Lance(opts) {
  if(!(this instanceof Lance)) {
    return new Lance(opts);
  }
  if(!opts || !opts.baseUrl) {
    throw new Error('baseUrl Missing.');
  }
  this._baseUrl = opts.baseUrl;
  this._rootPath = opts.rootPath || '';
  this._modelMap = opts._modelMap || {};
}

var proto = Lance.prototype;

proto.initialize = function() {
  var self = this;
  var url = this._baseUrl + this._rootPath;
  return fetch(url)
    .then(function(response) {
      return response.json();
    })
    .then(function(json) {
      return self._metaModel = self.wrap(json);
    });
}

proto.metaModel = function() {
  return this._metaModel;
}

proto.fetch = function(path, params, opts) {
  var opts = opts || {};
  var self = this;
  var url = self._baseUrl + path;
  if(params) {
    url = template(url, params);
  }
  console.log('FETCHING ', url);
  return fetch(url, {
    headers: opts.headers || {}
  })
    .then(function(data) {
      return data.json();
    })
    .then(function(json) {
      return self.wrap(json);
    });
}

/**
 * Wrap data in model
 * Wrap collection children in models too
 */
proto.wrap = function(data, parent) {
  var modelName = dotty.get(data, '_meta.class');
  var self = this;
  var model;
  if(modelName && typeof this._modelMap[modelName] === 'function') {
    model = new this._modelMap[modelName](data, this, parent);
  } else {
    model = new BaseModel(data, this, parent);
  }
  return model;
}

proto.create = function(linkName, data) {
  var self = this;
  return fetch({
    method: 'post',
    url: self._url + linkName,
    body: JSON.stringify(data)
  });
}

module.exports = Lance;

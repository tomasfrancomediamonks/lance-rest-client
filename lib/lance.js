var dotty = require('dotty');
var template = require('string-template');

var BaseModel = require('./base-model');

function Lance(opts) {
  if(!(this instanceof Lance)) {
    return new Lance(opts);
  }
  var self = this;
  if(!opts || !opts.baseUrl) {
    throw new Error('baseUrl Missing.');
  }
  self._baseUrl = opts.baseUrl;
  self._rootPath = opts.rootPath || '';
  self._modelMap = opts._modelMap || {};
  self._metaModel;
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
  var self = this;
  if(!self._metaModel) {
    throw new Error('initialize first');
  }
  return self._metaModel;
}

proto.fetch = function(linkName, opts) {
  var self = this;
  var opts = opts || {};
  var uri = self._metaModel.get(['_links', linkName, 'href']);
  if(!uri) {
    return new Promise(function() {
      throw new Error('invalid linkName');
    });
  }
  return fetchPath(uri, opts);
}

proto.fetchPath = function(uri, opts) {
  var self = this;
  opts = opts || {};
  console.log('FETCHING: ', uri);
  if(opts.params) {
    uri = template(uri, opts.params);
  } 
  return fetch(self._baseUrl + uri, {
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
  var self = this;
  var modelName = dotty.get(data, '_meta.class');
  var model;
  if(modelName && typeof this._modelMap[modelName] === 'function') {
    model = new this._modelMap[modelName](data, this, parent);
  } else {
    model = new BaseModel(data, this, parent);
  }
  return model;
}

proto.create = function(linkName, data, opts) {
  var self = this;
  opts = opts || {};
  var url = self._baseUrl + linkName;
  return fetch(url, {
    method: 'post',
    body: JSON.stringify(data),
    headers: opts.headers || {}
  })
    .then(function(data) {
      return self.wrap(data);
    });
}

module.exports = Lance;

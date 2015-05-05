var dotty = require('dotty');
var template = require('string-template');
var xtend = require('xtend');
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
  self._modelMap = opts.modelMap || {};
  self._metaModel;
}

var proto = Lance.prototype;

proto.initialize = function() {
  var self = this;
  var uri = this._baseUrl + this._rootPath;
  return fetch(uri)
    .then(function(response) {
      return response.json();
    })
    .then(function(json) {
      var metaModel = self.wrap(json);
      self._metaModel = metaModel;
      return self._metaModel;
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
  opts = xtend({
    headers: {}
  }, opts);
  var uri = self._metaModel.get(['_links', linkName, 'href']);
  if(!uri) {
    return new Promise(function() {
      throw new Error('invalid linkName');
    });
  }
  return self.fetchPath(uri, opts);
}

proto.fetchPath = function(link, opts) {
  var self = this;
  opts = opts || {};
  if(opts.params) {
    link = template(link, opts.params);
  }
  uri = self._baseUrl + link;
  console.log('GET ', uri);
  return fetch(uri, {
    headers: opts.headers
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

proto.create = function(linkName, opts) {
  var self = this;
  opts = xtend({
    headers: {
      'Content-Type': 'application/lance+json'
    },
    data: {}
  }, opts);
  var link = self._metaModel.get(['_links', linkName, 'href']);
  if(!link) {
    return new Promise(function() {
      throw new Error('Invalid linkName');
    });
  }
  if(typeof opts.data.toJson === 'function') {
    opts.data = opts.data.toJson();
  }
  var uri = self._baseUrl + link;
  return fetch(uri, {
    method: 'post',
    body: JSON.stringify(opts.data),
    headers: opts.headers
  })
    .then(function(data) {
      return data.json();
    })
    .then(function(json) {
      return self.wrap(json);
    });
}

module.exports = Lance;

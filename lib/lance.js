require('es6-promise').polyfill();
require('isomorphic-fetch');

var dotty = require('dotty');
var template = require('string-template');
var xtend = require('xtend');
var BaseModel = require('./base-model');

function _getIncidentFromFatalError(response) {
  return {
    extraInfo: response,
    isFatal: true,
    msg: response.statusText,
    responseStatus: response.status,
  };
}

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
  self._promise;
}

var proto = Lance.prototype;

proto.initialize = function(opts) {
  var self = this;
  opts = xtend({
    headers: {}
  }, opts);
  if(self._metaModel) {
    return new Promise(function(resolve, reject) {
      resolve(self._metaModel);
    })
  }
  if(self._promise) {
    return self._promise;
  }
  var uri = this._baseUrl + this._rootPath;
  var responseObject = null;

  return self._promise = fetch(uri, {
      headers: opts.headers
    })
    .then(function(response) {
      responseObject = response;

      return response.json();
    })
    .catch(function() {
      throw _getIncidentFromFatalError(responseObject);
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
  var links = dotty.get(self._metaModel._data, '_links');
  var link = self._metaModel.get(['_links', linkName, 'href']);
  if(!link) {
    return new Promise(function() {
      throw new Error('invalid linkName');
    });
  }
  return self._lance.fetchPath(link, opts);
}

proto.fetchPath = function(link, opts) {
  var self = this;
  opts = opts || {};
  if(opts.params) {
    link = template(link, opts.params);
  }
  uri = self._baseUrl + link;

  var callFailed = false;
  var responseObject = null;

  return fetch(uri, {
    headers: opts.headers
  })
    .then(function(response) {
      responseObject = response;

      if (response.status !== 200) {
        callFailed = true;
      }

      return response.json();
    })
    .catch(function() {
      throw _getIncidentFromFatalError(responseObject);
    })
    .then(function(json) {
      // When API response has an incident
      if (callFailed) {
        throw json;
      }
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

  // REVIEW: why this if?
  if(modelName && typeof this._modelMap[modelName] === 'function') {
    model = new this._modelMap[modelName](data, this, parent);
  } else if (!data) {
    return;
  } else {
    model = new BaseModel(data, this, parent);
  }

  return model;
}

// REVIEW: there should be an unwrap

proto.create = function(linkName, opts, data) {
  return this._save(linkName, opts, 'post', 201, data);
}

proto.update = function(linkName, opts, data) {
  return this._save(linkName, opts, 'put', 200, data);
}

proto._save = function(linkName, opts, method, expectedStatusCode, data) {
  var self = this;
  opts = opts || {};
  var headers = opts.headers || {};

  headers = xtend(headers, {
    'Content-Type': 'application/lance+json'
  });

  var link = self._metaModel.get(['_links', linkName, 'href']);
  if(!link) {
    return new Promise(function() {
      throw new Error('Invalid linkName');
    });
  }
  if(opts.params) {
    link = template(link, opts.params);
  }

  if(opts.jsonExpected === undefined || opts.jsonExpected === null) {
    opts.jsonExpected = true;
  }

  var uri = self._baseUrl + link;

  var requestParams = {
    method: method,
    headers: headers
  }
  if (data) {
    requestParams.body = JSON.stringify(data);
  }

  var callFailed = false;
  var responseStatus = null;
  var responseObject = null;

  return fetch(uri, requestParams)
    .then(function(response) {
      responseObject = response;
      responseStatus = response.status;
      if (responseStatus !== expectedStatusCode) {
        callFailed = true;
      }

      if (!opts.jsonExpected) {
        return;
      } else {
        return response.json();
      }
    })
    .catch(function() {
      throw _getIncidentFromFatalError(responseObject);
    })
    .then(function(json) {
      if (callFailed) {
        json.responseStatus = responseStatus;
        throw json;
      }
      var wrappedJson = self.wrap(json);

      if (!wrappedJson && opts.jsonExpected) {
        throw new Error('Expected response to contain JSON');
      }

      return wrappedJson;
    });
}

module.exports = Lance;

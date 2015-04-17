require('es6-promise').polyfill();
require('isomorphic-fetch');

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
}

var proto = Lance.prototype;

proto.initialize = function() {
  var self = this;

  return fetch(self._baseUrl + self._rootPath)
    .then(function(response) {
      return response.json();
    })
    .then(function(json) {
      self._metaModel = json;
    })
    .catch(function(ex) {
      console.log(ex);
    });
}

module.exports = Lance;
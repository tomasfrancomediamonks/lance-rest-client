require('es6-promise').polyfill();
require('isomorphic-fetch');

var Lance = require('./lib/lance');
var BaseModel = require('./lib/base-model');

module.exports = {
  Lance: Lance,
  BaseModel: BaseModel
}

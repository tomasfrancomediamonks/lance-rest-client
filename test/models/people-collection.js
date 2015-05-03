var _ = require('lodash');
var inherits = require('inherits');
var BaseModel = require('../../lib/base-model');

var PeopleCollection = function (data, lance, parent, parentPath) {
  BaseModel.call(this, data, lance, parent, parentPath);
};

inherits(PeopleCollection, BaseModel);

PeopleCollection.prototype.concatNames = function() {
  return _.map(this.collection(), function(p) {
    return p.get('name');
  }).join(', ');
};

module.exports = PeopleCollection;
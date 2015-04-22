var dotty = require('dotty');

function BaseModel(data) {
  if(!(this instanceof BaseModel)) {
    return new BaseModel(data);
  }

  if(typeof data !== 'object') {
    throw 'nope';
  }

  this._data = data;
}

var proto = BaseModel.prototype;

proto.get = function(field) {
  return dotty.get(this._data, field);
}

proto.set = function(field, value) {
  return dotty.put(this._data, field, value); 
}

proto.meta = function(field) {
  return dotty.get(this._data, '_meta.' + field);
}

proto.fetch = function(linkName, params, opts) {
  var self = this;
  return fetch({
    method: 'get',
    url: [self._url, linkName].join('/'),
    headers: opts.headers || {}
  });
}

proto.save = function(opts) {
  var isUpdateable = dotty.exists(this._data, '_links.self');
  if(!isUpdateable) {
    return Promise(function() {
      throw 'not updateable';
    });
  }
  return fetch({
    method: 'put',
    url: self._url,
    headers: opts.headers || {}
  })
    .then(function(data) {
      return data.json();
    })
}

proto.delete = function(opts) {
  var isDeleteable = dotty.exists(this._data, '_links.self');
  if(!isDeleteable) {
    return Promise(function() {
      throw 'not deletable';
    })
  }
  var self = this;
  return fetch({
    method: 'delete',
    url: self._data._links.self,
    headers: opts.headers || {}
  })
    .then(function(data) {
      return data.json();
    });
}

proto.collection = function() {
  var collectionNode = dotty.get(this._data, '_meta.collectionNode');
  return this._data[collectionNode] || [];
}

proto.totalCount = function() {
  var totalCount = dotty.get(this._data, '_meta.totalCount');
  if(totalCount || totalCount === 0 || totalCount === '0') {
    return totalCount;
  } else {
    return this.collection().length;
  }
}

proto.currentPage = function() {
  return dotty.get(this._data, '_meta.currentPage');
}

proto.pageCount = function() {
  return dotty.get(this._data, '_meta.pageCount');
}

proto.nextPage = function() {
  var hasNextPage = dotty.exists(this._data, '_links.next.href');
  if(!hasNextPage) {
    return new Promise(function() {
      throw 'no next page';
    });
  }
  fetch(this._data.links.next.href)
    .then(function(data) {
      return new BaseModel(data.json());
    });
}

proto.prevPage = function() {
  var hasPrevPage = dotty.exists(this._data, '_links.pev.href');
  if(!hasPrevPage) {
    return new Promise(function() {
      throw 'no prev page';
    });
  }
  fetch(this._data.links.prev.href)
    .then(function(data) {
      return new BaseModel(data.json());
    });
}

module.exports = BaseModel;
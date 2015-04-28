var dotty = require('dotty');
var clone = require('clone');

function BaseModel(data, lance, parent, parentPath) {
  if(!(this instanceof BaseModel)) {
    return new BaseModel(data);
  }
  var self = this;
  if(typeof data !== 'object') {
    throw 'nope';
  }
  if(!lance) {
    throw 'nope';
  }
  self._lance = lance;
  self._data = data;
  self.isDirty = false;
  self._parent = parent;
  self._parentPath = parentPath;
  self._collection = [];

  // instansiate children if we are a collection
  if(self.meta('collectionNode')) {
    var collectionNode = self.meta('collectionNode');
    self._collection = self._data[collectionNode].map(function(item) {
      return self._lance.wrap(item, self);
    });
  }
}

var proto = BaseModel.prototype;

proto.get = function(field) {
  var self = this;
  var out = dotty.get(self._data, field);
  if(typeof out === 'object' && !Array.isArray(out)) {
    return self._lance.wrap(out, self);
  }
  return out;
}

proto.set = function(field, value) {
  var self = this;
  self.isDirty = true;
  if(self._parent) {
    self._parent.set(self._parentPath + '.' + field, value);
  }
  return dotty.put(self._data, field, value); 
}

proto.meta = function(field) {
  var self = this;
  return self.get('_meta.' + field);
}

proto.fetch = function(linkName, params, opts) {
  var link = dotty.get(this._data, ['_links', linkName, 'href'].join('.'));
  if(!link) {
    return new Promise(function() { 
      throw 'invalid linkName';
    });
  }
  return this._lance.fetch(link, params, opts);
}

proto.save = function(opts) {
  var self = this;
  var opts = opts || {};
  if(!self.isDirty) {
    return new Promise(function() {
      return self;
    });
  }
  var selfPath = dotty.get(self._data, '_links.self.href');
  if(!selfPath) {
    return new Promise(function() {
      throw 'not updateable';
    });
  }
  var url = self._lance._baseUrl + selfPath;
  return fetch(url, {
    method: 'put',
    headers: opts.headers || {},
    body: JSON.stringify(self._data)
  })
    .then(function(data) {
      return data.json();
    })
    .then(function(json) {
      self.isDirty = false;
      self._data = json;
      return self;
    });
}

proto.fetchMore = function(params, opts) {
  var self = this;
  return self.fetch('self', params, opts);
}

proto.delete = function(opts) {
  var self = this;
  var opts = opts || {};
  var isDeleteable = dotty.exists(self._data, '_links.self.href');
  if(!isDeleteable) {
    return new Promise(function() {
      throw 'not deletable';
    })
  }
  var url = self._lance._baseUrl + dotty.get('_links.self.href');
  return fetch(url, {
    method: 'delete',
    headers: opts.headers || {}
  })
    .then(function(data) {
      return data.json();
    });
}

proto.collection = function() {
  var self = this;
  return self._collection;
}

proto.totalCount = function() {
  var self = this;
  var totalCount = dotty.get(self._data, '_meta.totalCount');
  if(totalCount || totalCount === 0 || totalCount === '0') {
    return totalCount;
  } else if(self.meta('collectionNode')) {
    return self.collection().length;
  } else {
    return 0;
  }
}

proto.currentPage = function() {
  var self = this;
  return dotty.get(self._data, '_meta.currentPage');
}

proto.pageCount = function() {
  var self = this;
  return dotty.get(self._data, '_meta.pageCount');
}

proto.nextPage = function() {
  var self = this;
  var hasNextPage = dotty.exists(self._data, '_links.next.href');
  if(!hasNextPage) {
    return new Promise(function() {
      throw 'no next page';
    });
  }
  var url = self._lance._baseUrl + self._data._links.next.href;
  return fetch(url)
    .then(function(data) {
      return data.json();
    })
    .then(function(json) {
      return self._lance.wrap(json);
    });
}

proto.prevPage = function() {
  var self = this;
  var hasPrevPage = dotty.exists(self._data, '_links.pev.href');
  if(!hasPrevPage) {
    return new Promise(function() {
      throw 'no prev page';
    });
  }
  var url = self._lance._baseUrl + self._data.links.prev.href;
  return fetch(url)
    .then(function(data) {
      return data.json();
    })
    .then(function(json) {
      return self._lance.wrap(json);
    });
}

proto.removeLanceProps = function() {
  var self = this;
  var _data = clone(self._data);
  delete _data._meta;
  delete _data._links;
  return _data;
}

module.exports = BaseModel;

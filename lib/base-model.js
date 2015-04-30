var dotty = require('dotty');
var clone = require('clone');
var xtend = require('xtend');

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

  self.populateCollection();
}

var proto = BaseModel.prototype;

proto.populateCollection = function() {
  var self = this;
  var collectionNode = self.meta('collectionNode');
  if(!collectionNode) {
    return;
  }
  self._collection = self._data[collectionNode]
    .map(function(item) {
      return self._lance.wrap(item, self);
    });
}

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

proto.fetch = function(linkName, opts) {
  var self = this;
  opts = xtend({}, opts);
  var uri = dotty.get(self._data, ['_links', linkName, 'href']);
  if(!uri) {
    return new Promise(function() { 
      throw new Error('invalid linkName');
    });
  }
  return self._lance.fetchPath(uri, opts);
}

proto.save = function(opts) {
  var self = this;
  opts = xtend({
    headers: {
      'Content-Type': 'application/json'         
    }
  }, opts);
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
  console.log('PUT ' + url);
  return fetch(url, {
    method: 'put',
    headers: opts.headers,
    body: JSON.stringify(self._data)
  })
    .then(function(data) {
      return data.json();
    })
    .then(function(json) {
      self.isDirty = false;
      self.setData(json);
      return self;
    });
}

proto.setData = function(data) {
  var self = this;
  self._data = data;
  self.populateCollection();
}

proto.fetchMore = function(params, opts) {
  var self = this;
  return self.fetch('self', params, opts);
}

proto.delete = function(opts) {
  var self = this;
  opts = xtend({
    headers: {}
  }, opts);
  var selfPath = dotty.get(self._data, '_links.self.href');
  if(!selfPath) {
    return new Promise(function() {
      throw new Error('not deletable');
    })
  }
  var uri = self._lance._baseUrl + selfPath;
  console.log('DELETE', uri);
  return fetch(uri, {
    method: 'delete',
    headers: opts.headers
  })
    .then(function(data) {
      return data.json();
    })
    .then(function(json) {
      return json;
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
  return dotty.get(self._data, '_meta.currentPage') || 0;
}

proto.pageCount = function() {
  var self = this;
  return dotty.get(self._data, '_meta.pageCount') || 0;
}

proto.nextPage = function() {
  var self = this;
  var hasNextPage = dotty.exists(self._data, '_links.next.href');
  if(!hasNextPage) {
    return new Promise(function() {
      return false;
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
      return false;
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

proto.toJson = function() {
  var self = this;
  var _data = clone(self._data);
  delete _data._meta;
  delete _data._links;
  return _data;
}

proto.toLanceJson = function() {
  var self = this;
  var _data = clone(self._data);
  return _data;
}

module.exports = BaseModel;

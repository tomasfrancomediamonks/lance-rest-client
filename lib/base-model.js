var dotty = require('dotty');
var clone = require('clone');
var xtend = require('xtend');

function BaseModel(data, lance, parent, parentPath) {
  if(!(this instanceof BaseModel)) {
    return new BaseModel(data);
  }
  var self = this;
  if(typeof data !== 'object') {
    throw 'BaseModel expected an object as `arguments[0]`. Instead it got: ' + data;
  }
  if(!lance) {
    throw 'BaseModel expected a Lance instance as `arguments[1]`. Instead it got: ' + lance;
  }
  self._lance = lance;
  self._data = data;
  self._isDirty = false;
  self._parent = parent;
  self._parentPath = parentPath;
  self._collection;
}

var proto = BaseModel.prototype;

proto._populateCollection = function() {
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
  var dots = Array.isArray(field) ? field : field.split('.');
  var lastObject = self;
  for(var i = 0; i < dots.length; i++) {
    var path = dots[i];
    var val = lastObject._data[path];
    if(val !== null && typeof val === 'object' && !Array.isArray(val)) {
      lastObject = self._lance.wrap(val, lastObject);
    } else {
      return val;
    }
 }
  return lastObject;
}

proto.set = function(field, value) {
  var self = this;
  self._isDirty = true;
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
      'Content-Type': 'application/lance+json'
    }
  }, opts);
  if(!self._isDirty) {
    return new Promise(function() {
      return self;
    });
  }
  var link = dotty.get(self._data, '_links.self.href');
  if(!link) {
    return new Promise(function() {
      throw 'not updateable';
    });
  }
  var uri = self._lance._baseUrl + link;
  return fetch(uri, {
    method: 'put',
    headers: opts.headers,
    body: JSON.stringify(self._data)
  })
    .then(function(data) {
      return data.json();
    })
    .then(function(json) {
      self._isDirty = false;
      self.setData(json);
      return self;
    });
}

proto.setData = function(data) {
  var self = this;
  self._isDirty = true;
  self._data = data;
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
  var link = dotty.get(self._data, '_links.self.href');
  if(!link) {
    return new Promise(function() {
      throw new Error('not deletable');
    })
  }
  var uri = self._lance._baseUrl + link;
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
  if(self._isDirty === true || !self._collection) {
    self._populateCollection();
  }
  return self._collection;
}

proto.totalCount = function() {
  var self = this;
  var totalCount = dotty.get(self._data, '_meta.totalCount');
  if(totalCount || totalCount === 0 || totalCount === '0') {
    return totalCount;
  } else if(self.isCollection()) {
    return self.collection().length;
  } else if(Array.isArray(self._data)) {
    return self._data.length
  } else {
    return 0;
  }
}

proto.currentPage = function() {
  var self = this;
  if (self.isCollection()) {
    return dotty.get(self._data, '_meta.currentPage') || 1;
  } else {
    return undefined;
  }
}

proto.pageCount = function() {
  var self = this;
  if (self.isCollection()) {
    return dotty.get(self._data, '_meta.pageCount') || 1;
  } else {
    return undefined;
  }
}

proto.nextPage = function() {
  var self = this;
  var link = dotty.get(self._data, '_links.next.href');
  if(!link) {
    return new Promise(function() {
      return false;
    });
  }
  var uri = self._lance._baseUrl + link;
  return fetch(uri)
    .then(function(data) {
      return data.json();
    })
    .then(function(json) {
      return self._lance.wrap(json);
    });
}

proto.prevPage = function() {
  var self = this;
  var link = dotty.get(self._data, '_links.pev.href');
  if(!link) {
    return new Promise(function() {
      return false;
    });
  }
  var uri = self._lance._baseUrl + link;
  return fetch(uri)
    .then(function(data) {
      return data.json();
    })
    .then(function(json) {
      return self._lance.wrap(json);
    });
}

proto.isDirty = function() {
  var self = this;
  return self._isDirty;
}

proto.isCollection = function() {
  var self = this;
  return (self.meta('collectionNode')) ? true : false;
}

proto.hasClass = function() {
  var self = this;
  return (self.meta('class')) ? true : false;
}

proto.hasSelf = function() {
  var self = this;
  var link = dotty.get(self._data, '_links.self.href');
  return (link) ? true : false;
}

proto.forEachLink = function(cb) {
  var self = this;
  for (var key in self._data._links) {
    cb(key, self._data._links[key]);
  }
}

proto.forEachMeta = function(cb) {
  var self = this;
  for (var key in self._data._meta) {
    cb(key, self.meta(key));
  }
}

proto.forEachGetter = function(cb) {
  var self = this;
  for (var key in self._data) {
    cb(key, self.get(key));
  }
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

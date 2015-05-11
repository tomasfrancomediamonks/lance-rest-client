var test = require('tape');
var BaseModel = require('../index').BaseModel;
var Lance = require('../index').Lance;

var json = {
  "_links": {
    "self": { "href": "/orders" },
    "next": { "href": "/orders?page=2" }
  },
  "_meta": {
    "collectionNode": "orderList",
    "totalCount": 26,
    "currentPage": 1,
    "pageCount": 9,
    "ordersProcessed": 13,
    "ordersUnderReview": 5,
    "ordersPending": 8
  },
  "orderList": [
    {
      "_links": {
        "self": { "href": "/order/88b4ddfe-e3c1-11e4-8a00-1681e6b88ec1" }
      },
      "_meta": {
        "class": "Order"
      },
      "_id": "88b4ddfe-e3c1-11e4-8a00-1681e6b88ec1",
      "total": 452.12
    },
    {
      "_links": {
        "self": { "href": "/order/fdb7a214-e3c4-11e4-8a00-1681e6b88ec1" }
      },
      "_meta": {
        "class": "Order"
      },
      "_id": "fdb7a214-e3c4-11e4-8a00-1681e6b88ec1",
      "total": 645.55
    },
    {
      "_links": {
        "self": { "href": "/order/618f076e-e488-11e4-8a00-1681e6b88ec1" }
      },
      "_meta": {
        "class": "Order"
      },
      "_id": "618f076e-e488-11e4-8a00-1681e6b88ec1",
      "total": 321.23
    }
  ]
}

test('BaseModel Class', function(t) {
  t.plan(6);

  var lance = new Lance({baseUrl: 'foobar'});

  t.ok(typeof BaseModel === 'function', 'is an function');

  var model = new BaseModel(json, lance);

  t.ok(model.totalCount() === 26, 'totalCount() works');

  t.ok(model.currentPage() === 1, 'currentPage() works');

  t.ok(model.pageCount() === 9, 'pageCount() works');

  t.ok(model.get('_links.self.href') === '/orders', 'get() works');

  t.ok(model.meta('ordersProcessed') === 13, 'meta() works');
});

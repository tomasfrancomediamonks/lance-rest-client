var test = require('tape');
var drakonian = require('drakonian');
var Lance = require('../index').Lance;
var BaseModel = require('../lib/base-model');
var PeopleCollection = require('./models/people-collection');

var DRAKONIAN_PORT = 4000;

test('e2e', function(t) {
  t.plan(53);
  drakonian.start('./test/server.apib', DRAKONIAN_PORT, function() {
    drakonian.addHandler('GET', '/v1/person/{uuid}', function(req, res, accept, action) {
      var response = drakonian.findResponse(/200/, accept, action);
      t.ok(req.params.uuid);
      res.send(JSON.parse(response.body));
    });
    drakonian.addHandler('PUT', '/v1/person/{uuid}', function(req, res, accept, action) {
      var response = drakonian.findResponse(/200/, accept, action);
      req.body = JSON.parse(req.body.toString());
      t.ok(req.params.uuid);
      t.ok(typeof req.body === 'object');
      t.ok(req.body.name === 'Foo Bar');
      res.send(JSON.parse(response.body));
    });
    drakonian.addHandler('POST', '/v1/people', function(req, res, accept, action) {
      var response = drakonian.findResponse(/200/, accept, action);
      req.body = JSON.parse(req.body.toString());
      t.ok(typeof req.body === 'object');
      t.ok(req.body.name === 'Some Name');
      res.send(JSON.parse(response.body));
    });
    start(t);
  }, {silent: true});
});

function start(t) {
  var lance = new Lance({
    baseUrl: 'http://localhost:' + DRAKONIAN_PORT,
    rootPath: '/v1',
    modelMap: {
      PeopleCollection: PeopleCollection
    }
  });

  var lance1 = new Lance({
    baseUrl: 'http://localhost:' + DRAKONIAN_PORT,
    rootPath: '/v1'
  });

  var p1;
  var p2;

  lance.initialize()
    .then(function(metaModel) {
      t.ok(typeof metaModel === 'object', 'should be an object');
      return metaModel.fetch('people');
    })
    .then(function(people) {
      t.ok(typeof people === 'object', 'should be an object');
      t.ok(people instanceof PeopleCollection, 'people should be instanceof PeopleCollection');
      t.ok(people.concatNames() === 'Miles Davis, Miles Davis, Miles Davis', 'instance method should work');
      t.ok(people.collection().length === people.meta('pageCount'), 'pageCount should work');
      return people.collection()[1];
    })
    .then(function(person) {
      return person.fetchMore();
    })
    .then(function(person) {
      t.ok(person.get('name') === 'Miles Davis', 'person name should be Miles Davis');
      t.ok(person.get('email') === 'miles.davis@gmail.com', 'person email should be miles.davis@gmail.com');
      var skillLevels = person.meta('skillLevels');
      t.ok(typeof skillLevels === 'object', 'should be an object');
      t.ok(skillLevels.collection().length === 2, 'collection length should be 2');
      t.ok(person.isDirty() === false, 'should not be dirty');
      t.ok(typeof skillLevels.set === 'function',  'should be a function');
      t.ok(skillLevels._parent, 'should have a parent');
      skillLevels.set('_meta.foo', 3);
      t.ok(skillLevels.get('_meta.foo') === 3, 'should be 3');
      t.ok(person.get('_meta.skillLevels._meta.foo') === 3, 'should be 3');
      person.set('name', 'Foo Bar');
      t.ok(person.isDirty() === true, 'should be dirty');
      t.ok(person.get('name') === 'Foo Bar', 'should be Foo Bar');
      p1 = person;
      return person.save();
    })
    .then(function(newPerson) {
      t.ok(newPerson == p1, 'should be the same object');
      return true;
    })
    .then(function() {
      return lance.fetch('person', {
        params: {
          uuid: 12345
        }
      });
    })
    .then(function(person) {
      t.ok(person.get('name') === 'Miles Davis', 'name should be Miles Davis');
      return person.delete();
    })
    .then(function(res) {
      t.ok(res.success === true);
      return lance.create('people', {
        data: {
          name: 'Some Name'
        }
      });
    })
    .then(function(newPerson) {
      t.ok(newPerson.get('_id') === '88b4ddfe-e3c1-11e4-8a00-1681e6b88ec1', 'id should be 88b4ddfe-e3c1-11e4-8a00-1681e6b88ec1');
      return lance1.initialize();
    })
    .then(function(metaModel) {
      t.ok(typeof metaModel === 'object', 'should be an object');
      return metaModel.fetch('people');
    })
    .then(function(people) {
      t.ok(typeof people === 'object', 'should be an object');
      t.ok(people instanceof BaseModel, 'people should be instanceof BaseModel');
      t.ok(typeof people.concatNames !== 'function', 'instance method should not work');
      t.ok(people.collection().length === people.meta('pageCount'), 'pageCount should work');
      return people.collection()[1];
    })
    .then(function(person) {
      return person.fetchMore();
    })
    .then(function(person) {
      t.ok(person.get('name') === 'Miles Davis', 'person name should be Miles Davis');
      t.ok(person.get('email') === 'miles.davis@gmail.com', 'person email should be miles.davis@gmail.com');
      var skillLevels = person.meta('skillLevels');
      t.ok(typeof skillLevels === 'object', 'should be an object');
      t.ok(skillLevels.collection().length === 2, 'collection length should be 2');
      t.ok(person.isDirty() === false, 'should not be dirty');
      t.ok(typeof skillLevels.set === 'function',  'should be a function');
      t.ok(skillLevels._parent, 'should have a parent');
      skillLevels.set('_meta.foo', 3);
      t.ok(skillLevels.get('_meta.foo') === 3, 'should be 3');
      t.ok(person.get('_meta.skillLevels._meta.foo') === 3, 'should be 3');
      person.set('name', 'Foo Bar');
      t.ok(person.isDirty() === true, 'should be dirty');
      t.ok(person.get('name') === 'Foo Bar', 'should be Foo Bar');
      p2 = person;
      return person.save();
    })
    .then(function(newPerson) {
      t.ok(newPerson == p2, 'should be the same object');
      return true;
    })
    .then(function() {
      return lance.fetch('person', {
        params: {
          uuid: 12345
        }
      });
    })
    .then(function(person) {
      t.ok(person.get('name') === 'Miles Davis', 'name should be Miles Davis');
      return person.delete();
    })
    .then(function(res) {
      t.ok(res.success === true);
      return lance.create('people', {
        data: {
          name: 'Some Name'
        }
      });
    })
    .then(function() {
      drakonian.close();
    })
    .catch(function(e) {
      console.log('ERROR ', e);
      drakonian.close();
    });
}

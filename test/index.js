var test = require('tape');
var drakonian = require('drakonian');
var Lance = require('../index').Lance;
var BaseModel = require('../lib/base-model');
var PeopleCollection = require('./models/people-collection');

var DRAKONIAN_PORT = 4000;

test('e2e', function(t) {
  t.plan(27);
  drakonian.start('./test/server.apib', DRAKONIAN_PORT, function() {
    drakonian.addHandler('GET', '/v1/person/{uuid}', function(req, res, accept, action) {
      var response = drakonian.findResponse(/200/, accept, action);
      t.ok(req.params.uuid);
      res.send(JSON.parse(response.body));
    });
    drakonian.addHandler('PUT', '/v1/person/{uuid}', function(req, res, accept, action) {
      var response = drakonian.findResponse(/200/, accept, action);
      t.ok(req.params.uuid);
      t.ok(typeof req.body === 'object');
      t.ok(req.body.name === 'Foo Bar');
      res.send(JSON.parse(response.body));
    });
    drakonian.addHandler('POST', '/v1/people', function(req, res, accept, action) {
      var response = drakonian.findResponse(/200/, accept, action);
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
  
  var p1;

  lance.initialize()
    .then(function(metaModel) {
      t.ok(typeof metaModel === 'object', 'is object');
      return metaModel.fetch('people');
    })
    .then(function(people) {
      t.ok(typeof people === 'object', 'is object');
      t.ok(people instanceof PeopleCollection, 'people should be instanceof PeopleCollection');
      t.ok(people.concatNames() === 'Miles Davis, Miles Davis, Miles Davis', 'instance method should work');
      t.ok(people.collection().length === people.meta('pageCount'), 'pageCount');
      return people.collection()[1];
    })
    .then(function(person) {
      return person.fetchMore();
    })
    .then(function(person) {
      t.ok(person.get('name') === 'Miles Davis', 'person name');
      t.ok(person.get('email') === 'miles.davis@gmail.com', 'person email');
      var skillLevels = person.meta('skillLevels');
      t.ok(typeof skillLevels === 'object');
      t.ok(skillLevels.collection().length === 2, 'collection');
      t.ok(person.isDirty === false, 'isDirty');
      t.ok(typeof skillLevels.set === 'function');
      t.ok(skillLevels._parent);
      skillLevels.set('_meta.foo', 3);
      t.ok(skillLevels.get('_meta.foo') === 3);
      t.ok(person.get('_meta.skillLevels._meta.foo') === 3);
      person.set('name', 'Foo Bar');
      t.ok(person.isDirty === true, 'isDirty');
      t.ok(person.get('name') === 'Foo Bar', 'get');
      p1 = person;
      return person.save();
    })
    .then(function(newPerson) {
      t.ok(newPerson == p1, 'equality');
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
      t.ok(person.get('name') === 'Miles Davis');
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
      t.ok(newPerson.get('_id') === '88b4ddfe-e3c1-11e4-8a00-1681e6b88ec1');
    })
    .then(function() {
      drakonian.close();
    })
    .catch(function(e) {
      console.log('ERROR ', e);
      drakonian.close();
    });
}

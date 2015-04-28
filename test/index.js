var test = require('tape');
var drakonian = require('drakonian');
var Lance = require('../index').Lance;

var DRAKONIAN_PORT = 4000;

test('e2e', function(t) {
  drakonian.addHandler('DELETE', '/v1/person/{id}', function(req, res) {
    
  });
  drakonian.start('./test/server.apib', DRAKONIAN_PORT, function() {
   start(t); 
  });
});

function start(t) {
  t.plan(16);

  var lance = new Lance({
    baseUrl: 'http://localhost:' + DRAKONIAN_PORT,
    rootPath: '/v1'
  });

  lance.initialize()
    .then(function(metaModel) {
      t.ok(typeof metaModel === 'object', 'is object');
      return metaModel.fetch('people');
    })
    .then(function(people) {
      t.ok(typeof people === 'object', 'is object');
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
      return lance._metaModel.fetch('person', {uuid: 13123123123});
    })
    .then(function(person) {
      t.ok(person.get('name') === 'Miles Davis');
      return person.delete();
    })
    .then(function() {
      drakonian.close();
    })
    .catch(function(e) {
      t.comment('ERROR');
      t.comment(e.stack);
      drakonian.close();
    });
}

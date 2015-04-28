var test = require('tape');
var drakonian = require('drakonian');
var Lance = require('../index').Lance;

var DRAKONIAN_PORT = 4000;

var throwErr = function(err) { throw err; }

test('e2e', function(t) {
  drakonian.start('./test/server.apib', DRAKONIAN_PORT, function() {
   start(t); 
  });
});

function start(t) {
  t.plan(11);

  var lance = new Lance({
    baseUrl: 'http://localhost:' + DRAKONIAN_PORT,
    rootPath: '/v1'
  });

  lance.initialize()
    .then(function(metaModel) {
      t.ok(typeof metaModel === 'object', 'is object');
      return metaModel.fetch('people');
    }, throwErr)
    .then(function(people) {
      t.ok(typeof people === 'object', 'is object');
      t.ok(people.collection().length === people.meta('pageCount'), 'pageCount');
      return people.collection()[1];
    }, throwErr)
    .then(function(person) {
      return person.fetchMore();
    }, throwErr)
    .then(function(person) {
      t.ok(person.get('name') === 'Miles Davis', 'person name');
      t.ok(person.get('email') === 'miles.davis@gmail.com', 'person email');
      t.ok(person.meta('skillLevels').collection().length === 2, 'collection');
      t.ok(person.isDirty === false, 'isDirty');
      person.set('name', 'Foo Bar');
      t.ok(person.isDirty === true, 'isDirty');
      t.ok(person.get('name') === 'Foo Bar', 'get');
      p1 = person;
      return person.save();
    }, throwErr)
    .then(function(newPerson) {
      t.ok(newPerson == p1, 'equality');
      return true;
    }, throwErr)
    .then(function() {
      return lance._metaModel.fetch('person', {uuid: 13123123123});
    })
    .then(function(person) {
      drakonian.close();
      t.ok(person.get('name') === 'Miles Davis');
      return person.delete();
    })
    .then(function() {
    }, throwErr);
}

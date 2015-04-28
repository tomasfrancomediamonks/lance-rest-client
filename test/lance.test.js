var test = require('tape');
var Lance = require('../index').Lance;

test('Lance Class', function(t) {
  t.plan(1);

  t.ok(typeof Lance === 'function', 'is a function');
});

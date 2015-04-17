var test = require('tape');
var uriTemplate = require('../lib/uri-template');

test('URI templating tokenizer', function(t) {
  t.plan(8);

  t.deepEqual(uriTemplate.tokenize('awdawd{foo}wadw{bar}'), [{token: 'foo', isOptional: false}, {token: 'bar', isOptional: false}]);
  t.deepEqual(uriTemplate.tokenize('dwdw{invali{d}'), []);
  t.deepEqual(uriTemplate.tokenize('dwdw{invali{}d}'), []);
  t.deepEqual(uriTemplate.tokenize('{}'), []);
  t.deepEqual(uriTemplate.tokenize('wdddd}'), []);
  t.deepEqual(uriTemplate.tokenize('}{'), []);
  t.deepEqual(uriTemplate.tokenize('dwa{?foobar}111111'), [{token: 'foobar', isOptional: true}]);
  t.deepEqual(uriTemplate.tokenize('{?foo}{bar}'), [{token: 'foo', isOptional: true}, {token: 'bar', isOptional: false}]);
});
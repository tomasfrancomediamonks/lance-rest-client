var test = require('tape');
var uriTemplate = require('../lib/uri-template');
var template = require('string-template');

test('URI templating tokenizer', function(t) {
  t.plan(8);

  t.deepEqual(uriTemplate.tokenize('awdawd{foo}wadw{bar}'), {foo: true, bar: true});
  t.deepEqual(uriTemplate.tokenize('dwdw{invali{d}'), []);
  t.deepEqual(uriTemplate.tokenize('dwdw{invali{}d}'), []);
  t.deepEqual(uriTemplate.tokenize('{}'), []);
  t.deepEqual(uriTemplate.tokenize('wdddd}'), []);
  t.deepEqual(uriTemplate.tokenize('}{'), []);
  t.deepEqual(uriTemplate.tokenize('dwa{?foobar}111111'), {foobar: false});
  t.deepEqual(uriTemplate.tokenize('{?foo}{bar}'), {foo: false, bar: true});
});

test('replace', function(t) {
  t.plan(2);

  t.equal(uriTemplate.replace('ddddd{foo}', {foo: 123}), true);
  t.equal(uriTemplate.replace('ddddd{?foo}', {foo: 123}), false);
});
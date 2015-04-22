var test = require('tape');
var drakonian = require('drakonian');
var Lance = require('../index');

drakonian.start('./test/server.apib', 4000, function() {
  drakonian.close();
});
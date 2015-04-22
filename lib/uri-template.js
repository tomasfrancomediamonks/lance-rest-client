var template = require('string-template');

module.exports = {
  tokenize: tokenize,
  replace: replace
}

function tokenize(uri) {
  if(typeof uri !== 'string') {
    return [];
  }

  var tokens = {};
  var currentToken = [];
  var isInsideToken = false;
  var uri = uri.split('');

  for(var i = 0; i < uri.length; i++) {
    var c = uri[i];

    if(uri[i] === '{') {
      if(isInsideToken === true) {
        break;
      }
      isInsideToken = true;
      continue;
    }
    if(uri[i] === '}') {
      if(isInsideToken === false) {
        break;
      }

      if(currentToken.length) {
        var isRequired = currentToken[0] !== '?';
        currentToken = isRequired ? currentToken.join('') : currentToken.slice(1).join('');
        tokens[currentToken] = isRequired;
        currentToken = [];
      }

      isInsideToken = false;
      continue;
    }
    if(isInsideToken) {
      currentToken.push(c);
    }
  }

  if(isInsideToken === true) {
    return {};
  }

  return tokens;
}

function replace(uri, props) {
  var tokens = tokenize(uri);

  var requiredFields = Object.keys(tokens).filter(function(propName) {
    var token = tokens[propName];
    return token === true;
  });

  return requiredFields.some(function(field) {
    return !!props[field];
  });
}
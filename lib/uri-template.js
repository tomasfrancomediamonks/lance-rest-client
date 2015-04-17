
module.exports = {
  tokenize: tokenize
}

function tokenize(uri) {
  if(typeof uri !== 'string') {
    return [];
  }

  var tokens = [];
  var currentToken = [];
  var isInsideToken = false;
  var uri = uri.split('');

  for(var i = 0; i < uri.length; i++) {
    var c = uri[i];

    if(uri[i] === '{') {
      if(isInsideToken === true) {
        return [];
      }
      isInsideToken = true;
      continue;
    }
    if(uri[i] === '}') {
      if(isInsideToken === false) {
        return [];
      }

      if(currentToken.length) {
        var isOptional = currentToken[0] === '?';
        var token = isOptional ? currentToken.slice(1).join('') : currentToken.join('');
        tokens.push({
          isOptional: isOptional,
          token: token
        });
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
    return [];
  }

  return tokens;
}
var Predictor = require('./src/predictor');
var parser = require('./src/parser');
var fs = require('fs');
var code = fs.readFileSync('test.txt', 'utf8');

var predictor = new Predictor(code);
console.log(predictor);

function next() {
  if(predictor.next()) {
    console.log(predictor.segments.map(function(v) {
      return v.length;
    }));
    setTimeout(next, 10);
  }
}

next();

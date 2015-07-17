var Predictor = require('./src/predictor');
var Interpreter = require('./src/interpreter');
var parser = require('./src/parser');
var fs = require('fs');
var code = fs.readFileSync('test.txt', 'utf8');

var predictor = new Predictor(code);

while(predictor.next()) {
}

var bytecode = predictor.bytecode();
var interpreter = new Interpreter(bytecode.code, bytecode.debug);
while(interpreter.next()) {
  process.stdout.write(interpreter.shift());
}

console.log(interpreter.shift());

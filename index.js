var Interpreter = require('./src/interpreter');
var parser = require('./src/parser');
var fs = require('fs');
var code = fs.readFileSync('test.txt', 'utf8');

var interpreter = new Interpreter(code);

while(interpreter.next()) {
}
  process.stdout.write(interpreter.shift());

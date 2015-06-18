var Interpreter = require('./src/interpreter');
var parser = require('./src/parser');
var fs = require('fs');
var code = fs.readFileSync('test.txt').toString('utf8');

var interpreter = new Interpreter(code);
console.log(interpreter);

function next() {
  var tile = interpreter.map.get(interpreter.state.x, interpreter.state.y);
  console.log('--', interpreter.state.x, interpreter.state.y, interpreter.state.direction);
  console.log(interpreter.state.memory[interpreter.state.selected].constructor.name, interpreter.state.selected);
  if(tile) {
    console.log(tile.direction, tile.command, tile.data || '');
    console.log(parser.encodeSyllable(tile));
  }
  console.log(interpreter.state.output.join(''));
  interpreter.next();
  if(interpreter.state.running) {
    setTimeout(next, 10);
  } else {
    console.log(interpreter.shift());
  }
}

next();

var Interpreter = require('./src/interpreter');
var code = '밤밣따빠밣밟따뿌\n'
  + '빠맣파빨받밤뚜뭏\n'
  + '돋밬탕빠맣붏두붇\n'
  + '볻뫃박발뚷투뭏붖\n'
  + '뫃도뫃희멓뭏뭏붘\n'
  + '뫃봌토범더벌뿌뚜\n'
  + '뽑뽀멓멓더벓뻐뚠\n'
  + '뽀덩벐멓뻐덕더벅';

var interpreter = new Interpreter(code);
console.log(interpreter);

function next() {
  var tile = interpreter.map.get(interpreter.state.x, interpreter.state.y);
  console.log('--', interpreter.state.x, interpreter.state.y, interpreter.state.direction);
  console.log('Stack', interpreter.state.stack, interpreter.state.memory[interpreter.state.stack].join(','));
  console.log(tile.command, tile.direction, tile.data);
  interpreter.next();
  setTimeout(next, 100);
}

next();
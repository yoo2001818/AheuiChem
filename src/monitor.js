var Hangul = require('./hangul');

function Monitor(interpreter) {
  this.interpreter = interpreter;
}

Monitor.prototype.getStatus = function() {
  var str = '';
  var state = this.interpreter.state;
  if(state.running) {
    var direction = state.direction;
    str += '실행 중 (위치 '+state.x+', '+state.y+')\n';
  } else {
    str += '실행 끝\n';
  }
  for(var i = 0; i < 28; ++i) {
    if(state.selected == i) {
      str += '>> ';
    }
    str += Hangul.final[i]+': ';
    str += state.memory[i].data.join(' ');
    str += '\n';
  }
  return str;
};

module.exports = Monitor;

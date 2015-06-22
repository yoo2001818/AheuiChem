// Entry point of the application

var parser = require('./parser');
var Renderer = require('./renderer');
var Interpreter = require('./interpreter');
var Predictor = require('./predictor');
var Hangul = require('./hangul');

var interpreter;
var renderer;
var predictor;

window.onload = function() {
  document.getElementById('codeForm').onsubmit = function() {
    var code = document.getElementById('codeForm-code').value;
    interpreter = new Interpreter(code);
    var predictQuota = interpreter.map.width * interpreter.map.height * 2;
    predictor = new Predictor(interpreter.map);
    for(var i = 0; i < predictQuota; ++i) {
      if(!predictor.next()) break;
    }
    predictor.updated = [];
    renderer = new Renderer(document.getElementById('viewport'), interpreter);
    window.interpreter = interpreter;
    window.predictor = predictor;
    document.getElementById('codeForm-output').value = '';
    // TODO implement input
    return false;
  }
  setInterval(function() {
    if(!interpreter || !renderer) return;
    renderer.preNext();
    interpreter.next();
    // Predict
    /*
    predictor.stack = [{
      segment: predictor.segments.length,
      x: interpreter.state.x,
      y: interpreter.state.y,
      direction: {
        x: interpreter.state.direction.x,
        y: interpreter.state.direction.y
      }
    }];
    predictor.segments.push([]);
    for(var i = 0; i < predictQuota; ++i) {
      if(!predictor.next()) break;
    }
    interpreter.updated = interpreter.updated.concat(predictor.updated);
    predictor.updated = [];*/
    renderer.postNext();
    document.getElementById('codeForm-output').value += interpreter.shift();
    // update debug status
    document.getElementById('codeForm-debug').value = (function() {
      var str = '';
      var state = interpreter.state;
      if(state.running) {
        var direction = state.direction;
        str += '실행 중 (위치 '+state.x+', '+state.y+') ';
        str += '(방향 '+direction.x+', '+direction.y+')\n';
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
    })();
  }, 20);
  document.getElementById('captureBtn').onclick = function() {
    renderer.canvases.dump(document.getElementById('capture'));
  }
}

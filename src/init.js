// Entry point of the application

var parser = require('./parser');
var Renderer = require('./renderer');
var Interpreter = require('./interpreter');
var Predictor = require('./predictor');
var Monitor = require('./monitor');
var ToolBox = require('./toolbox');

var interpreter;
var renderer;
var predictor;
var monitor;
var toolbox;
var running = false;

window.onload = function() {
  document.getElementById('codeForm').onsubmit = function() {
    var code = document.getElementById('codeForm-code').value;
    interpreter = new Interpreter(code);
    monitor = new Monitor(interpreter);
    var predictQuota = interpreter.map.width * interpreter.map.height * 2;
    predictor = new Predictor(interpreter.map);
    for(var i = 0; i < predictQuota; ++i) {
      if(!predictor.next()) break;
    }
    predictor.updated = [];
    renderer = new Renderer(document.getElementById('viewport'), interpreter);
    toolbox = new ToolBox(renderer);
    window.interpreter = interpreter;
    window.predictor = predictor;
    document.getElementById('codeForm-output').value = '';
    // TODO implement input
    return false;
  }
  document.getElementById('codeForm-reset').onclick = function() {
    interpreter.reset();
    renderer.reset();
    document.getElementById('codeForm-output').value = '';
  }
  document.getElementById('codeForm-resume').onclick = function() {
    running = true;
  }
  document.getElementById('codeForm-pause').onclick = function() {
    running = false;
  }
  setInterval(function() {
    if(!running || !interpreter || !renderer) return;
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
    document.getElementById('codeForm-debug').value = monitor.getStatus();
  }, 20);
  document.getElementById('captureBtn').onclick = function() {
    renderer.canvases.dump(document.getElementById('capture'));
  }
}

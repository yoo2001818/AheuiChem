// Entry point of the application

var parser = require('./parser');
var Renderer = require('./renderer');
var Interpreter = require('./interpreter');
var Predictor = require('./predictor');

var interpreter;
var renderer;
var predictor;

window.onload = function() {
  var code = document.getElementById('source').innerHTML;
  interpreter = new Interpreter(code);
  var predictQuota = interpreter.map.width * interpreter.map.height * 2;
  predictor = new Predictor(interpreter.map);
  for(var i = 0; i < predictQuota; ++i) {
    if(!predictor.next()) break;
  }
  predictor.updated = [];
  renderer = new Renderer(document.getElementById('viewport'), interpreter);
  setInterval(function() {
    renderer.preNext();
    interpreter.next();
    // Predict
    
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
    predictor.updated = [];
    renderer.postNext();
  }, 20);
  window.interpreter = interpreter;
  window.predictor = predictor;
}

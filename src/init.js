// Entry point of the application

var parser = require('./parser');
var Renderer = require('./renderer');
var Interpreter = require('./interpreter');
var Predictor = require('./predictor');

var interpreter;
var renderer;

window.onload = function() {
  var code = document.getElementById('source').innerHTML;
  interpreter = new Interpreter(code);
  var predictQuota = interpreter.map.width * interpreter.map.height * 2;
  var predictor = new Predictor(interpreter.map);
  for(var i = 0; i < predictQuota; ++i) {
    if(!predictor.next()) break;
    predictor.updated = [];
  }
  renderer = new Renderer(document.getElementById('viewport'), interpreter);
  setInterval(function() {
    renderer.preNext();
    interpreter.next();
    renderer.postNext();
  }, 20);
  window.interpreter = interpreter;
}

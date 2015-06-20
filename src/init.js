// Entry point of the application

var parser = require('./parser');
var Renderer = require('./renderer');
var Interpreter = require('./interpreter');
var Predictor = require('./predictor');

var interpreter;
var renderer;

window.onload = function() {
  var code = document.getElementById('source').innerHTML;
  if(window.location.hash == '#predict') {
    interpreter = new Predictor(code);
  } else {
    interpreter = new Interpreter(code);
  }
  renderer = new Renderer(document.getElementById('viewport'), interpreter);
  setInterval(function() {
    renderer.preNext();
    interpreter.next();
    renderer.postNext();
  }, 20);
  window.interpreter = interpreter;
}

// Entry point of the application

var parser = require('./parser');
var Renderer = require('./renderer');
var Interpreter = require('./interpreter');

var interpreter;
var renderer;

window.onload = function() {
  var code = document.getElementById('source').innerHTML;
  interpreter = new Interpreter(code);
  renderer = new Renderer(document.getElementById('viewport'), interpreter);
  setInterval(function() {
    renderer.preNext();
    interpreter.next();
    renderer.postNext();
  }, 10);
  window.interpreter = interpreter;
}
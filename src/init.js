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
    for(var i = 0; i < 2; ++i)
    interpreter.next();
    renderer.postNext();
  }, 20);
  window.interpreter = interpreter;
}
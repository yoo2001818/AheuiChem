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

function reset(initial) {
  if(!initial) {
    interpreter.reset();
    renderer.reset();
  }
  toolbox.hookCanvas(function() {
    return !running;
  }, function() {
    // Clear all paths and reset
    for(var y = 0; y < interpreter.map.height; ++y) {
      for(var x = 0; x < interpreter.map.width; ++x) {
        var tile = interpreter.map.get(x, y);
        var cacheTile = renderer.cacheMap.get(x, y);
        if(tile) {
          tile.directions = {};
          tile.segments = {};
          cacheTile.directions = {};
        }
      }
    }
    var predictQuota = interpreter.map.width * interpreter.map.height * 2;
    predictor = new Predictor(interpreter.map);
    var key = setInterval(function() {
      for(var i = 0; i < 1000; ++i) {
        if(!predictor.next() || predictQuota-- < 0) {
          renderer.redraw();
          clearInterval(key);
          break;
        }
      }
    }, 20);
  });
  document.getElementById('codeForm-output').value = '';
  running = false;
}

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
    if(toolbox) toolbox.renderer = renderer;
    else toolbox = new ToolBox(renderer);
    window.interpreter = interpreter;
    window.predictor = predictor;
    reset(true);
    // TODO implement input
    return false;
  }
  document.getElementById('codeForm-reset').onclick = function() {
    reset();
  }
  document.getElementById('codeForm-resume').onclick = function() {
    running = true;
  }
  document.getElementById('codeForm-pause').onclick = function() {
    running = false;
  }
  document.getElementById('codeForm-step').onclick = function() {
    if(!interpreter || !renderer) return;
    renderer.preNext();
    interpreter.next();
    renderer.postNext();
    document.getElementById('codeForm-output').value += interpreter.shift();
    // update debug status
    document.getElementById('codeForm-debug').value = monitor.getStatus();
  }
  setInterval(function() {
    if(!running || !interpreter || !renderer) return;
    renderer.preNext();
    interpreter.next();
    renderer.postNext();
    document.getElementById('codeForm-output').value += interpreter.shift();
    document.getElementById('codeForm-debug').value = monitor.getStatus();
  }, 20);
  document.getElementById('captureBtn').onclick = function() {
    renderer.canvases.dump(document.getElementById('capture'));
  }
}

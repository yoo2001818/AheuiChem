// Entry point of the application

var parser = require('./parser');
var Renderer = require('./renderer');
var Interpreter = require('./interpreter');
var Predictor = require('./predictor');
var Monitor = require('./monitor');
var ToolBox = require('./toolbox');
var Keyboard = require('./keyboard');

var interpreter;
var renderer;
var predictor;
var monitor;
var toolbox;
var keyboard;
var running = false;

function repredict(initial) {
  // Clear all paths and reset
  if (!initial && renderer) {
    for (var y = 0; y < interpreter.map.height; ++y) {
      for (var x = 0; x < interpreter.map.width; ++x) {
        var tile = interpreter.map.get(x, y);
        var cacheTile = renderer.cacheMap.get(x, y);
        if (tile) {
          tile.directions = {};
          tile.segments = {};
          cacheTile.directions = {};
        }
      }
    }
  }
  var predictQuota = interpreter.map.width * interpreter.map.height * 2;
  predictor = new Predictor(interpreter.map);
  for (var i = 0; i < predictQuota; ++i) {
    if (!predictor.next()) break;
  }
  if (!initial && renderer) renderer.redraw();
}

function reset(initial) {
  if (!initial) {
    interpreter.reset();
    renderer.reset();
  }
  document.getElementById('codeForm-output').value = '';
  running = false;
}

function step() {
  interpreter.next();
  renderer.render();
  document.getElementById('codeForm-output').value += interpreter.shift();
  document.getElementById('codeForm-debug').value = monitor.getStatus();
}

window.onload = function() {
  document.getElementById('codeForm').onsubmit = function() {
    var code = document.getElementById('codeForm-code').value;
    interpreter = new Interpreter(code);
    monitor = new Monitor(interpreter);
    repredict(true);
    renderer = new Renderer(document.getElementById('canvas'), interpreter);
    if (toolbox) toolbox.renderer = renderer;
    else {
      toolbox = new ToolBox(renderer);
      toolbox.hookCanvas(function() {
        return !running;
      }, function() {
        repredict();
      });
      keyboard = new Keyboard(toolbox);
    }
    window.interpreter = interpreter;
    window.predictor = predictor;
    reset(true);
    // TODO implement input
    return false;
  };
  document.getElementById('codeForm-export').onclick = function() {
    document.getElementById('codeForm-code').value = parser.encode(
      interpreter.map);
  };
  document.getElementById('codeForm-reset').onclick = function() {
    reset();
  };
  document.getElementById('codeForm-resume').onclick = function() {
    running = true;
  };
  document.getElementById('codeForm-pause').onclick = function() {
    running = false;
  };
  document.getElementById('codeForm-step').onclick = function() {
    if (!interpreter || !renderer) return;
    step();
    running = false;
  };
  setInterval(function() {
    if (!running || !interpreter || !renderer) return;
    step();
  }, 20);
  document.getElementById('captureBtn').onclick = function() {
    renderer.canvases.dump(document.getElementById('capture'));
  };
};

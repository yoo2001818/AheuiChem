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
  } else {
    toolbox.hookEvents();
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
    var ctx = renderer.canvases.get('path');
    ctx.clearRect(0, 0, renderer.canvases.width, renderer.canvases.height);
    var key = setInterval(function() {
      for(var i = 0; i < 20; ++i) {
        if(!predictor.next() || predictQuota-- < 0) {
          clearInterval(key);
          break;
        }
      }
      while(predictor.updated.length > 0) {
        var pos = predictor.updated.shift();
        renderer.updateTile(pos.x, pos.y);
      }
    }, 100);
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
    toolbox = new ToolBox(renderer);
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

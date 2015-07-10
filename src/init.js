// Entry point of the application

var parser = require('./parser');
var Renderer = require('./renderer');
var Interpreter = require('./interpreter');
var Predictor = require('./predictor');
var Monitor = require('./monitor');
var ToolBox = require('./toolbox');
var Viewport = require('./viewport');
var ContextMenu = require('./contextmenu');
var Playback = require('./playback');
var Keyboard = require('./keyboard');

var interpreter;
var renderer;
var predictor;
var monitor;
var toolbox;
var viewport;
var contextmenu;
var playback;
var keyboard;
var initialized = false;

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
  playback.running = false;
}

function initialize() {
  if(initialized) {
    toolbox.renderer = renderer;
    viewport.renderer = renderer;
    contextmenu.renderer = renderer;
    playback.renderer = renderer;
    playback.interpreter = interpreter;
    return;
  }
  playback = new Playback(interpreter, renderer, function() {
    document.getElementById('codeForm-output').value += interpreter.shift();
    document.getElementById('codeForm-debug').value = monitor.getStatus();
  }, reset.bind(this, false));
  toolbox = new ToolBox(renderer);
  contextmenu = new ContextMenu(document.getElementById('context-bg'),
    document.getElementById('context-push'), renderer);
  viewport = new Viewport(document.getElementById('viewport'), toolbox,
    renderer, contextmenu);
  viewport.checkCallback = function() {
    return !playback.running;
  };
  viewport.clickCallback = repredict.bind(this, false);
  keyboard = new Keyboard();
  // Toolbox editor KeyMapping
  keyboard.push({
    map: Keyboard.EditorKeyMapping,
    callback: function(mapping) {
      toolbox.changeSelected(mapping[0], mapping[1]);
    }
  });
  initialized = true;
}

window.onload = function() {
  document.getElementById('codeForm').onsubmit = function() {
    var code = document.getElementById('codeForm-code').value;
    interpreter = new Interpreter(code);
    monitor = new Monitor(interpreter);
    repredict(true);
    renderer = new Renderer(document.getElementById('canvas'), interpreter);
    initialize();
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
  /*
  document.getElementById('captureBtn').onclick = function() {
    renderer.canvases.dump(document.getElementById('capture'));
  };
  */
};

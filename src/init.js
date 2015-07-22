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
var UndoMachine = require('./undomachine');
var MenuPane = require('./menupane');
var LayerToggler = require('./layertoggler');

var interpreter;
var renderer;
var predictor;
var monitor;
var toolbox;
var viewport;
var contextmenu;
var playback;
var keyboard;
var undomachine;
var menupane;
var layertoggler;
var initialized = false;

function repredict(initial) {
  // Clear all paths and reset
  if (!initial && renderer) {
    if(interpreter.trim()) {
      renderer.reset();
    } else {
      for (var y = 0; y < interpreter.map.height; ++y) {
        for (var x = 0; x < interpreter.map.width; ++x) {
          var tile = interpreter.map.get(x, y);
          var cacheTile = renderer.cacheMap.get(x, y);
          if (tile) {
            tile.directions = [];
            tile.segments = {};
            cacheTile.directions = {};
          }
        }
      }
    }
  }
  var predictQuota = interpreter.map.width * interpreter.map.height * 80;
  predictor = new Predictor(interpreter.map);
  for (var i = 0; i < predictQuota; ++i) {
    if (!predictor.next()) break;
  }
  predictor.postCheck();
  if (!initial && renderer) renderer.redraw();
  window.predictor = predictor;
}

function reset(initial) {
  if (!initial) {
    interpreter.reset();
    renderer.reset();
  }
  document.getElementById('codeForm-output').value = '';
  // supply input
  interpreter.push(document.getElementById('codeForm-input').value);
  playback.playing = false;
  playback.running = false;
  playback.update();
  document.activeElement.blur();
}

function initialize() {
  if(initialized) {
    layertoggler.renderer = renderer;
    toolbox.renderer = renderer;
    viewport.renderer = renderer;
    contextmenu.renderer = renderer;
    playback.renderer = renderer;
    playback.interpreter = interpreter;
    return;
  }
  undomachine = new UndoMachine(function() {
    document.getElementById('icon-undo').className = 'icon'+
      (undomachine.undoStack.length > 0 ? '' : ' disabled');
    document.getElementById('icon-redo').className = 'icon'+
      (undomachine.redoStack.length > 0 ? '' : ' disabled');
  });
  playback = new Playback(interpreter, renderer, function() {
    document.getElementById('codeForm-output').value += interpreter.shift();
    document.getElementById('codeForm-debug').value = monitor.getStatus();
  }, reset.bind(this, false));
  toolbox = new ToolBox(renderer);
  layertoggler = new LayerToggler(renderer,
    document.getElementById('view-table'));
  // TODO should be changed. it's dirty.
  layertoggler.trim = function() {
    interpreter.trim(true);
    renderer.reset();
    repredict(false);
  }
  contextmenu = new ContextMenu(document.getElementById('context-bg'),
    document.getElementById('context'),
    document.getElementById('context-push'),
    document.getElementById('context-final'), renderer);
  menupane = new MenuPane(
    ['menu-import', 'menu-status', 'menu-help'].map(function(v) {
      return document.getElementById(v);
    }),
    ['menu-btn-import', 'menu-btn-status', 'menu-btn-help'].map(function(v) {
      return document.getElementById(v);
    })
  );
  viewport = new Viewport(document.getElementById('viewport'), toolbox,
    renderer, contextmenu, undomachine);
  viewport.checkCallback = function() {
    return !playback.running;
  };
  viewport.clickCallback = repredict.bind(this, false);
  keyboard = new Keyboard();
  // Ctrl KeyMapping
  keyboard.push({
    map: {
      z: function() {
        undomachine.undo();
      },
      // I prefer Ctrl+Shift+Z though.
      y: function() {
        undomachine.redo();
      },
      ' ': function() {
        playback.playing = true;
        playback.running = !playback.running;
        playback.update();
      }
    },
    callback: function(mapping) {
      mapping();
    }
  });
  // Toolbox editor KeyMapping
  keyboard.push({
    map: Keyboard.EditorKeyMapping,
    callback: function(mapping) {
      toolbox.changeSelected(mapping[0], mapping[1]);
    }
  });
  contextmenu.keyboard = keyboard;
  contextmenu.undomachine = undomachine;
  initialized = true;
}

function loadCode(code) {
  interpreter = new Interpreter(code);
  monitor = new Monitor(interpreter);
  repredict(true);
  renderer = new Renderer(document.getElementById('canvas'), interpreter);
  initialize();
  undomachine.reset();
  window.undomachine = undomachine;
  window.interpreter = interpreter;
  window.predictor = predictor;
  reset(true);
}

window.onload = function() {
  loadCode(' ');
  document.getElementById('codeForm').onsubmit = function() {
    var code = document.getElementById('codeForm-code').value;
    loadCode(code);
    return false;
  };
  document.getElementById('codeForm-export').onclick = function() {
    document.getElementById('codeForm-code').value = parser.encode(
      interpreter.map);
  };
  document.getElementById('icon-undo').onclick = function() {
    undomachine.undo();
  };
  document.getElementById('icon-redo').onclick = function() {
    undomachine.redo();
  };
  /*
  document.getElementById('captureBtn').onclick = function() {
    renderer.canvases.dump(document.getElementById('capture'));
  };
  */
};

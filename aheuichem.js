(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var parser = require('./parser');
var Interpreter = require('./interpreter');

function TileAction(tile, tileX, tileY, data, renderer, callback) {
  this.tile = tile;
  this.data = data;
  this.tileX = tileX;
  this.tileY = tileY;
  this.renderer = renderer;
  this.callback = callback;
}

TileAction.prototype.exec = function() {
  this.before = {};
  for(var key in this.data) {
    this.before[key] = this.tile[key];
    this.tile[key] = this.data[key];
  }
  this.update();
}

TileAction.prototype.undo = function() {
  for(var key in this.before) {
    this.tile[key] = this.before[key];
  }
  this.update();
}

TileAction.prototype.update = function() {
  // Fill the data with 0 if it's required and null.
  var command = Interpreter.CommandMap[this.tile.command];
  if(command != null && command.argument && this.tile.data == null) {
    this.tile.data = 0;
  }
  if(this.tile.command == 'push' && this.tile.data > 9) {
    // Force set data to 0 as it can't handle larger than 9
    this.tile.data = 0;
  }
  this.tile.original = parser.encodeSyllable(this.tile);
  this.renderer.map.set(this.tileX, this.tileY, this.tile);
  this.renderer.updateTile(this.tileX, this.tileY);
  if(this.callback) this.callback();
}

module.exports = TileAction;

},{"./interpreter":7,"./parser":13}],2:[function(require,module,exports){
function CanvasLayer(viewport, layerNames, width, height) {
  this.layers = [];
  this.layersByName = {};
  this.layerContexts = [];
  this.layerContextsByName = {};
  this.width = width;
  this.height = height;
  this.viewport = viewport;
  viewport.style.position = 'relative';
  viewport.style.width = width + 'px';
  viewport.style.height = height + 'px';
  while (viewport.firstChild) viewport.removeChild(viewport.firstChild);
  for (var i = 0; i < layerNames.length; ++i) {
    var layerName = layerNames[i];
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.position = 'absolute';
    var ctx = canvas.getContext('2d');
    this.layers[i] = canvas;
    this.layersByName[layerName] = canvas;
    this.layerContexts[i] = ctx;
    this.layerContextsByName[layerName] = ctx;
    viewport.appendChild(canvas);
  }
}

CanvasLayer.prototype.setSize = function(width, height) {
  this.viewport.style.width = width + 'px';
  this.viewport.style.height = height + 'px';
  this.width = width;
  this.height = height;
  for (var i = 0; i < this.layers.length; ++i) {
    var layer = this.layers[i];
    layer.width = width;
    layer.height = height;
  }
};

CanvasLayer.prototype.get = function(layerName) {
  return this.layerContextsByName[layerName];
};

CanvasLayer.prototype.getCanvas = function(layerName) {
  return this.layersByName[layerName];
};

CanvasLayer.prototype.forEach = function(callback, thisObj) {
  this.layerContexts.forEach(callback, thisObj);
};

CanvasLayer.prototype.canvasForEach = function(callback, thisObj) {
  this.layers.forEach(callback, thisObj);
};

CanvasLayer.prototype.dump = function(targetCanvas) {
  var ctx = targetCanvas.getContext('2d');
  targetCanvas.width = this.width;
  targetCanvas.height = this.height;
  this.canvasForEach(function(canvas) {
    ctx.drawImage(canvas, 0, 0);
  });
};

module.exports = CanvasLayer;

},{}],3:[function(require,module,exports){
var Table = require('./table');
var TileMap = require('./tilemap');
var Keyboard = require('./keyboard');
var Hangul = require('./hangul');
var parser = require('./parser');
var TileAction = require('./action');
var Interpreter = require('./interpreter');

var UtilityKeyBinding = [
  [
    {
      name: "복사",
      exec: function() {
        // TODO yes, yes. I know. This code is like a 30 days old spaghetti
        // in the garbage can that smells like rotten ActiveX.
        // Which means... it needs to be fixed.
        this.clipboard = {
          command: this.tile.command,
          direction: this.tile.direction,
          data: this.tile.data
        }
      }
    },
    {
      name: "자르기",
      exec: function() {
        this.clipboard = {
          command: this.tile.command,
          direction: this.tile.direction,
          data: this.tile.data
        }
        this.undomachine.run(new TileAction(this.tile, this.tileX, this.tileY,
          {
            command: 'none',
            direction: 'none',
            breakpoint: false
          }, this.renderer));
      }
    },
    {
      name: "붙이기",
      exec: function() {
        this.undomachine.run(new TileAction(this.tile, this.tileX, this.tileY,
          this.clipboard, this.renderer));
      }
    },
    {
      name: "중단점",
      exec: function() {
        this.undomachine.run(new TileAction(this.tile, this.tileX, this.tileY,
          {
            breakpoint: !this.tile.breakpoint
          }, this.renderer));
      }
    }
  ]
];

var PushKeyBinding = [
  [0, 2, 3, 4, 5],
  [6, 7, 8, 9]
];

var FinalKeyBinding = [
  ' ㄱㄴㄷㄹㄲㄳㄵㄶ'.split(''),
  'ㅁㅂㅅㅇㅈㄺㄻㄼㄽ'.split(''),
  'ㅊㅋㅌㅍㅎㄾㄿㅀㅄㅆ'.split('')
];

// Generate keymap from table
var UtilityBindingMap = Keyboard.createKeyMap(UtilityKeyBinding,
  Keyboard.KeyNumberLayout);
var PushKeyBindingMap = Keyboard.createKeyMap(PushKeyBinding);
var FinalKeyBindingMap = Keyboard.createKeyMap(FinalKeyBinding);

function ContextMenu(container, element, pushElement, finalElement,
  renderer, clickCallback,
  keyboard, undomachine) {
  this.container = container;
  this.element = element;
  this.pushElement = pushElement;
  this.finalElement = finalElement;
  this.hideEvent = this.hide.bind(this);
  this.init();
  this.renderer = renderer;
  this.clickCallback = clickCallback;
  this.keyboard = keyboard;
  this.undomachine = undomachine;
  this.tileX = null;
  this.tileY = null;
  this.tile = null;
  this.clipboard = {};
}

ContextMenu.prototype.update = function() {
  if(this.clickCallback) this.clickCallback(this.tileX, this.tileY, this.tile);
}

ContextMenu.prototype.init = function() {
  var self = this;
  var tilemap = TileMap.fromArray(PushKeyBinding);
  // TODO no getElementById in class
  // This is exactly same situation as toolbox
  var viewport = document.getElementById('push-table');
  var pushTable = new Table(viewport, tilemap, function(node, tile, x, y) {
    if(tile == null) {
      node.parentNode.removeChild(node);
      return;
    }
    node.id = 'push-table-'+tile;
    node.appendChild(document.createTextNode(tile));
    var divNode = document.createElement('div');
    divNode.className = 'key';
    divNode.appendChild(document.createTextNode(Keyboard.KeyLayout[y][x]));
    node.appendChild(divNode);
    node.addEventListener('click', function() {
      self.undomachine.run(new TileAction(self.tile, self.tileX, self.tileY,
        {
          data: tile
        }, self.renderer));
      self.update();
    });
  });
  var tilemap = TileMap.fromArray(FinalKeyBinding);
  // ... No Ctrl+C, Ctrl+V Please?
  var viewport = document.getElementById('final-table');
  var pushTable = new Table(viewport, tilemap, function(node, tile, x, y) {
    if(tile == null) {
      node.parentNode.removeChild(node);
      return;
    }
    node.id = 'final-table-'+tile;
    node.appendChild(document.createTextNode(tile));
    var divNode = document.createElement('div');
    divNode.className = 'key';
    divNode.appendChild(document.createTextNode(Keyboard.KeyShiftLayout[y][x]));
    node.appendChild(divNode);
    node.addEventListener('click', function() {
      self.undomachine.run(new TileAction(self.tile, self.tileX, self.tileY,
        {
          data: Hangul.final.indexOf(tile)
        }, self.renderer));
      self.update();
    });
  });
  var tilemap = TileMap.fromArray(UtilityKeyBinding);
  var viewport = document.getElementById('utility-table');
  var utilityTable = new Table(viewport, tilemap, function(node, tile, x, y) {
    if(tile == null) {
      node.parentNode.removeChild(node);
      return;
    }
    node.id = 'utility-table-'+tile;
    node.appendChild(document.createTextNode(tile.name));
    var divNode = document.createElement('div');
    divNode.className = 'key';
    divNode.appendChild(document.createTextNode(Keyboard.KeyNumberLayout[y][x]));
    node.appendChild(divNode);
    node.addEventListener('click', function() {
      tile.exec.call(self);
      self.update();
    });
  });
}

ContextMenu.prototype.show = function(x, y) {
  var self = this;
  this.container.style.display = 'block';
  this.element.style.display = 'block';
  setTimeout(function() {
    self.element.style.top = y+'px';
    self.element.style.left = Math.max(0,
      Math.min(window.innerWidth - self.element.offsetWidth,
      x-self.element.offsetWidth/2+self.renderer.width/2))+'px';
    self.container.addEventListener('click', self.hideEvent);
    self.container.addEventListener('contextmenu', self.hideEvent);
  }, 0);
  var self = this;
  // Prevent going more
  this.keyboard.push(null);
  this.keyboard.push({
    map: UtilityBindingMap,
    callback: function(data) {
      data.exec.call(self);
      self.update();
      self.hide();
    }
  });
  // TODO it could be better really.
  if(this.tile.command == 'push') {
    this.finalElement.style.display = 'none';
    this.pushElement.style.display = 'block';
    // Push keyboard state
    this.keyboard.push({
      map: PushKeyBindingMap,
      callback: function(data) {
        self.undomachine.run(new TileAction(self.tile, self.tileX, self.tileY,
          {
            data: data
          }, self.renderer));
        self.update();
        self.hide();
      }
    });
  } else if(Interpreter.CommandMap[this.tile.command] &&
    Interpreter.CommandMap[this.tile.command].argument){
    this.finalElement.style.display = 'block';
    this.pushElement.style.display = 'none';
    // Push keyboard state
    this.keyboard.push({
      map: FinalKeyBindingMap,
      callback: function(data) {
        self.undomachine.run(new TileAction(self.tile, self.tileX, self.tileY,
          {
            data: Hangul.final.indexOf(data)
          }, self.renderer));
        self.update();
        self.hide();
      }
    });
  } else {
    // Hide all
    this.finalElement.style.display = 'none';
    this.pushElement.style.display = 'none';
    // Push keyboard state
    this.keyboard.push(null);
  }
}

ContextMenu.prototype.hide = function(e) {
  this.container.removeEventListener('click', this.hideEvent);
  this.container.removeEventListener('contextmenu', this.hideEvent);
  this.container.style.display = 'none';
  this.element.style.display = 'none';
  this.keyboard.pop();
  this.keyboard.pop();
  this.keyboard.pop();
  if(e) {
    e.preventDefault();
    return false;
  }
}

module.exports = ContextMenu;

},{"./action":1,"./hangul":5,"./interpreter":7,"./keyboard":8,"./parser":13,"./table":19,"./tilemap":20}],4:[function(require,module,exports){
// 1000 : keep direction
// -1000 : reverse direction

var DirectionMap = {
  'up': {
    x: 0,
    y: -1
  },
  'left': {
    x: -1,
    y: 0
  },
  'right': {
    x: 1,
    y: 0
  },
  'down': {
    x: 0,
    y: 1
  },
  'skip-up': {
    x: 0,
    y: -2
  },
  'skip-left': {
    x: -2,
    y: 0
  },
  'skip-right': {
    x: 2,
    y: 0
  },
  'skip-down': {
    x: 0,
    y: 2
  },
  'horizontal': {
    x: 1000,
    y: -1000
  },
  'vertical': {
    x: -1000,
    y: 1000
  },
  'reverse': {
    x: -1000,
    y: -1000
  },
  'none': {
    x: 1000,
    y: 1000
  }
};

var UP = 1;
var DOWN = 2;
var LEFT = 4;
var RIGHT = 8;
// Added to handle predictor appropriately
var SKIP_UP = 16;
var SKIP_DOWN = 32;
var SKIP_LEFT = 64;
var SKIP_RIGHT = 128;

var DirectionBitMap = {
  'up': UP,
  'down': DOWN,
  'left': LEFT,
  'right': RIGHT,
  'horizontal': LEFT | RIGHT,
  'vertical': UP | DOWN,
  'up-left': UP | LEFT,
  'down-left': DOWN | LEFT,
  'up-right': UP | RIGHT,
  'down-right': DOWN | RIGHT,
  // Added to handle predictor appropriately
  'skip-up': SKIP_UP,
  'skip-down': SKIP_DOWN,
  'skip-left': SKIP_LEFT,
  'skip-right': SKIP_RIGHT
};

var DirectionBitRevMap = {};
Object.keys(DirectionBitMap).forEach(function(k) {
  DirectionBitRevMap[DirectionBitMap[k]] = k;
});

function process(pos, map, direction, preDir, updated, segment) {
  var tile = map.get(pos.x, pos.y);
  // Add 'skip' direction to skipping tile
  if (isSkipping(direction.x, direction.y)) {
    var skipX = move(pos.x, sign(direction.x), map.width);
    var skipY = move(pos.y, sign(direction.y), map.height);
    var skipTile = map.get(skipX, skipY);
    updated.push({
      x: skipX,
      y: skipY
    });
    if (direction.x) {
      write(skipTile, 'skip-horizontal', segment);
    } else {
      write(skipTile, 'skip-vertical', segment);
    }
  }
  // Move to tile
  updated.push({
    x: pos.x,
    y: pos.y
  });
  var bitDir = preDir | convertToBits(direction.x, direction.y);
  write(tile, DirectionBitRevMap[bitDir], segment);
  pos.x = move(pos.x, direction.x, map.width);
  pos.y = move(pos.y, direction.y, map.height);
}

function sign(a) {
  if (a > 0) return 1;
  else if (a < 0) return -1;
  else return 0;
}

function isSkipping(x, y) {
  return Math.abs(x) >= 2 || Math.abs(y) >= 2;
}

function calculate(current, target) {
  if (target == 1000) return current;
  else if (target == -1000) return -current;
  return target;
}

function move(pos, dir, size) {
  pos += dir;
  if (pos < 0) pos = Math.max(0, size + pos);
  if (pos >= size) pos = Math.min(size - 1, pos - size);
  return pos;
}

function convertToBits(x, y, honorSkips) {
  var val = 0;
  if(honorSkips && y == -2) return SKIP_UP;
  if(honorSkips && y == 2) return SKIP_DOWN;
  if(honorSkips && x == -2) return SKIP_LEFT;
  if(honorSkips && x == 2) return SKIP_RIGHT;
  if (y <= -1) val |= UP;
  if (y >= 1) val |= DOWN;
  if (x <= -1) val |= LEFT;
  if (x >= 1) val |= RIGHT;
  return val;
}

function write(tile, direction, segment) {
  // Ignore if it's -1
  if (segment == -1) return;
  if (tile == null) return;
  if (tile.directions == null) {
    tile.directions = [];
  }
  if (tile.directions[segment] == null) {
    tile.directions[segment] = [];
  }
  if (tile.directions[segment].indexOf(direction) == -1) {
    tile.directions[segment].push(direction);
  }
}

module.exports = {
  map: DirectionMap,
  bitMap: DirectionBitMap,
  bitRevMap: DirectionBitRevMap,
  process: process,
  calculate: calculate,
  move: move,
  convertToBits: convertToBits,
  write: write
};

},{}],5:[function(require,module,exports){
var Hangul = {
  initial: 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'.split(''),
  medial: 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'.split(''),
  final: ' ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'.split(''),
  code: 0xAC00
};

module.exports = Hangul;

},{}],6:[function(require,module,exports){
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

},{"./contextmenu":3,"./interpreter":7,"./keyboard":8,"./layertoggler":9,"./menupane":11,"./monitor":12,"./parser":13,"./playback":14,"./predictor":15,"./renderer":16,"./toolbox":21,"./undomachine":22,"./viewport":23}],7:[function(require,module,exports){
var parser = require('./parser');
var memory = require('./memory');
var Direction = require('./direction');

var CommandMap = {
  'end': {
    data: 0,
    output: 0,
    exec: function(tile, state, memory) {
      state.running = false;
    }
  },
  'add': buildCalcCommand(function(a, b) {
    return b + a;
  }),
  'multiply': buildCalcCommand(function(a, b) {
    return b * a;
  }),
  'subtract': buildCalcCommand(function(a, b) {
    return b - a;
  }),
  'divide': buildCalcCommand(function(a, b) {
    return b / a | 0;
  }),
  'mod': buildCalcCommand(function(a, b) {
    return b % a;
  }),
  'pop': {
    data: 1,
    output: 0,
    exec: function(tile, state, memory) {
      memory.pull();
    }
  },
  'pop-unicode': {
    data: 1,
    output: 0,
    exec: function(tile, state, memory) {
      var data = memory.pull();
      state.output.push(String.fromCharCode(data));
    }
  },
  'pop-number': {
    data: 1,
    output: 0,
    exec: function(tile, state, memory) {
      var data = memory.pull();
      state.output = state.output.concat(String(data).split(''));
    }
  },
  'push': {
    data: 0,
    output: 1,
    argument: true,
    exec: function(tile, state, memory) {
      memory.push(tile.data);
    }
  },
  'push-unicode': {
    data: 0,
    output: 1,
    exec: function(tile, state, memory) {
      var val = state.input.shift();
      if(val == null) memory.push(-1);
      else memory.push(val.charCodeAt(0));
    }
  },
  'push-number': {
    data: 0,
    output: 1,
    exec: function(tile, state, memory) {
      var buffer = '';
      while(state.input.length) {
        var val = state.input[0];
        if(/[0-9-+]/.test(val)) {
          // Push number
          buffer += val;
          state.input.shift();
        } else {
          if(buffer.length > 0) {
            // End of number; exit
            break;
          } else {
            // Clear buffer
            buffer = '';
            state.input.shift();
          }
        }
      }
      if(buffer.length > 0) {
        var value = parseInt(buffer);
        memory.push(value);
      } else {
        memory.push(-1);
      }
    }
  },
  'copy': {
    data: 1,
    output: 2,
    exec: function(tile, state, memory) {
      memory.copy();
    }
  },
  'flip': {
    data: 2,
    output: 2,
    exec: function(tile, state, memory) {
      memory.flip();
    }
  },
  'select': {
    data: 0,
    output: 0, // This requires some special handling
    argument: true,
    exec: function(tile, state, memory) {
      state.selected = tile.data;
    }
  },
  'move': {
    data: 1,
    output: 0, // This also requires some special handling
    argument: true,
    exec: function(tile, state, memory) {
      var target = state.memory[tile.data];
      var data = memory.pull();
      target.push(data);
    }
  },
  'compare': {
    data: 2,
    output: 1,
    exec: function(tile, state, memory) {
      var a = memory.pull();
      var b = memory.pull();
      memory.push(b >= a ? 1 : 0);
    }
  },
  'condition': {
    data: 1,
    output: 0,
    exec: function(tile, state, memory) {
      var data = memory.pull();
      if (data === 0) return true;
    }
  }
};

function buildCalcCommand(callback) {
  return {
    data: 2,
    output: 1,
    exec: function(tile, state, memory) {
      var a = memory.pull();
      var b = memory.pull();
      memory.push(callback(a, b));
    }
  };
}

function Interpreter(code) {
  if (typeof code == 'string') {
    this.map = parser.parse(code);
  } else {
    this.map = code;
  }
  this.reset();
}

Interpreter.prototype.push = function(data) {
  this.state.input = this.state.input.concat(data.split(''));
};

Interpreter.prototype.shift = function() {
  // Return the string and empties it
  var output = this.state.output.join('');
  this.state.output = [];
  return output;
};

Interpreter.prototype.reset = function() {
  this.state = {
    x: 0,
    y: 0,
    direction: {
      x: 0,
      y: 1
    },
    memory: {},
    selected: 0,
    input: [],
    output: [],
    running: true
  };
  this.updated = [];
  // Initialize memory
  for (var i = 0; i < 28; ++i) {
    switch (i) {
      case 21:
        this.state.memory[i] = new memory.Queue();
        break;
      case 28:
        // Extension memory, defaults to stack
        this.state.memory[i] = new memory.Stack();
        break;
      default:
        this.state.memory[i] = new memory.Stack();
        break;
    }
  }
};

Interpreter.prototype.next = function() {
  if (!this.state.running) return false;
  var direction = this.state.direction;
  var preDir = Direction.convertToBits(-direction.x, -direction.y);
  var tile = this.map.get(this.state.x, this.state.y);
  var error = false;
  if (tile !== null) {
    // Set the direction
    var tileDir = Direction.map[tile.direction];
    direction.x = Direction.calculate(direction.x, tileDir.x);
    direction.y = Direction.calculate(direction.y, tileDir.y);
    // Execute the command
    var selected = this.state.selected;
    var memory = this.state.memory[selected];
    var command = CommandMap[tile.command];
    if (command) {
      if (memory.canPull(command.data)) {
        error = !!command.exec(tile, this.state, memory);
      } else {
        error = true;
      }
    }
  }
  // Just stop
  if (!this.state.running) return false;
  if (error) {
    direction.x *= -1;
    direction.y *= -1;
  }
  Direction.process(this.state, this.map, direction, preDir, this.updated,
    -1);
  var newTile = this.map.get(this.state.x, this.state.y);
  this.state.breakpoint = newTile.breakpoint;
  return this.state.running;
};

// TODO move it somewhere?
// Trims the tilemap
Interpreter.prototype.trim = function(checkUsed) {
  var requestedWidth = 0;
  var requestedHeight = 0;
  for(var y = 0; y < this.map.height; ++y) {
    var currentWidth = 0;
    for(var x = 0; x < this.map.width; ++x) {
      var tile = this.map.get(x, y);
      if(tile == null) continue;
      if(tile.direction == 'none' && tile.command == 'none') continue;
      // ... why is it here..
      if(checkUsed && tile.directions == null) continue;
      if(checkUsed && tile.directions.length == 0) continue;
      currentWidth = x + 1;
    }
    if(currentWidth > 0) requestedHeight = y + 1;
    if(currentWidth > requestedWidth) requestedWidth = currentWidth;
  }
  var hasChanged = false;
  if(this.map.width != requestedWidth) hasChanged = true;
  if(this.map.height != requestedHeight) hasChanged = true;
  this.map.width = requestedWidth;
  this.map.height = requestedHeight;
  return hasChanged;
}

Interpreter.CommandMap = CommandMap;

module.exports = Interpreter;

},{"./direction":4,"./memory":10,"./parser":13}],8:[function(require,module,exports){
var KeyNumberLayout = [
  '1234567890'
].map(function(v) {
  return v.split('');
});

var KeyLayout = [
  'qwert', 'asdfg', 'zxcvb'
].map(function(v) {
  return v.split('');
});

var KeyShiftLayout = [
  'qwertQWERT', 'asdfgASDFG', 'zxcvbZXCVBN'
].map(function(v) {
  return v.split('');
});

var EditorKeyMapping = {
  'q': ['arrow', 'none'],
  'w': ['arrow', 'up'],
  'e': ['command', 'none'],
  'r': ['command', 'select'],
  't': ['command', 'move'],
  'a': ['arrow', 'left'],
  's': ['arrow', 'down'],
  'd': ['arrow', 'right'],
  'f': ['command', 'push'],
  'g': ['command', 'pop'],
  'z': ['command', 'subtract'],
  'x': ['command', 'divide'],
  'c': ['command', 'add'],
  'v': ['command', 'multiply'],
  'b': ['command', 'mod'],
  'Q': ['arrow', 'reverse'],
  'W': ['arrow', 'skip-up'],
  'E': ['command', 'end'],
  'R': ['command', 'condition'],
  'T': ['command', 'compare'],
  'A': ['arrow', 'skip-left'],
  'S': ['arrow', 'skip-down'],
  'D': ['arrow', 'skip-right'],
  'F': ['command', 'copy'],
  'G': ['command', 'flip'],
  'Z': ['arrow', 'horizontal'],
  'X': ['arrow', 'vertical'],
  'C': ['command', 'pop-number'],
  'V': ['command', 'pop-unicode'],
  'B': ['command', 'push-unicode'],
  'N': ['command', 'push-number']
};

function Keyboard() {
  this.stack = [];
  this.registerEvents();
}

Keyboard.prototype.push = function(entry) {
  this.stack.push(entry);
}

Keyboard.prototype.pop = function() {
  return this.stack.pop();
}

Keyboard.prototype.registerEvents = function() {
  var self = this;
  document.addEventListener('keypress', function(e) {
    var keyPressed = e.key || String.fromCharCode(e.charCode);
    for(var i = self.stack.length - 1; i >= 0; --i) {
      var entry = self.stack[i];
      // Act differently if Ctrl is pressed.
      if(e.ctrlKey) entry = self.stack[0];
      if(!entry || !entry.map) continue;
      if(entry.map[keyPressed] != undefined) {
        entry.callback(entry.map[keyPressed]);
        return false;
      } else if(entry.map[keyPressed.toUpperCase()] != undefined) {
        // Quick dirty method to use uppercase if lowercase is not available
        entry.callback(entry.map[keyPressed.toUpperCase()]);
        return false;
      }
    }
  });
}

Keyboard.KeyNumberLayout = KeyNumberLayout;
Keyboard.KeyLayout = KeyLayout;
Keyboard.KeyShiftLayout = KeyShiftLayout;
Keyboard.EditorKeyMapping = EditorKeyMapping;

// An utility function to create keybinding map from 2D array.
Keyboard.createKeyMap = function(binding, layout) {
  if(layout == null) layout = KeyShiftLayout;
  var map = {};
  for(var y = 0; y < binding.length; ++y) {
    for(var x = 0; x < binding[y].length; ++x) {
      // It's completely fine to use keyShiftLayout.
      map[layout[y][x]] = binding[y][x];
    }
  }
  return map;
}

module.exports = Keyboard;

},{}],9:[function(require,module,exports){
var TileMap = require('./tilemap');
var Table = require('./table');

var LayerToggleBinding = [
  [
    {
      name: '청소',
      data: 'clean'
    },
    {
      name: '명령',
      data: 'command'
    },
    {
      name: '방향',
      data: 'arrow'
    },
    {
      name: '경로',
      data: 'path',
    },
    {
      name: '글자',
      data: 'text'
    },
    {
      name: '배경',
      data: 'highlight'
    }
  ]
];

function LayerToggler(renderer, element) {
  this.renderer = renderer;
  this.element = element;
  this.init();
}

LayerToggler.prototype.init = function() {
  var self = this;
  var tilemap = TileMap.fromArray(LayerToggleBinding).transpose();
  console.log(tilemap);
  var table = new Table(this.element, tilemap, function(node, tile, x, y) {
    if(tile == null) {
      node.parentNode.removeChild(node);
      return;
    }
    node.id = 'view-'+tile.data;
    node.className = 'view';
    node.appendChild(document.createTextNode(tile.name));
    node.addEventListener('click', function() {
      // TODO move it somewhere else????
      if(tile.data == 'clean') {
        self.trim();
        return;
      }
      var style = self.renderer.canvases.getCanvas(tile.data).style;
      if(style.visibility == 'hidden') {
        style.visibility = 'visible';
        node.className = 'view';
      } else {
        style.visibility = 'hidden';
        node.className = 'view selected';
      }
    });
  });
}

module.exports = LayerToggler;

},{"./table":19,"./tilemap":20}],10:[function(require,module,exports){
function Memory() {}

Memory.prototype.push = function(data) {};

Memory.prototype.pull = function() {};

Memory.prototype.canPull = function(quantity) {};

Memory.prototype.copy = function() {};

Memory.prototype.flip = function() {};

function Stack() {
  this.data = [];
}

Stack.prototype.push = function(data) {
  this.data.push(data);
};

Stack.prototype.pull = function() {
  return this.data.pop();
};

Stack.prototype.canPull = function(quantity) {
  return this.data.length >= quantity;
};

Stack.prototype.copy = function() {
  if (!this.canPull(1)) return false;
  var data = this.pull();
  this.data.push(data);
  this.data.push(data);
  return true;
};

Stack.prototype.flip = function() {
  if (!this.canPull(2)) return false;
  var a = this.pull();
  var b = this.pull();
  this.data.push(a);
  this.data.push(b);
  return true;
};

function Queue() {
  this.data = [];
}

Queue.prototype.push = function(data) {
  this.data.push(data);
};

Queue.prototype.pull = function() {
  return this.data.shift();
};

Queue.prototype.canPull = function(quantity) {
  return this.data.length >= quantity;
};

Queue.prototype.copy = function() {
  if (!this.canPull(1)) return false;
  var data = this.data[0];
  this.data.unshift(data);
  return true;
};

Queue.prototype.flip = function() {
  if (!this.canPull(2)) return false;
  var a = this.pull();
  var b = this.pull();
  this.data.unshift(b);
  this.data.unshift(a);
  return true;
};

module.exports.Memory = Memory;
module.exports.Stack = Stack;
module.exports.Queue = Queue;
},{}],11:[function(require,module,exports){
function MenuPane(panes, buttons) {
  this.panes = panes;
  this.buttons = buttons;
  this.selected = -1;
  this.registerEvents();
}

MenuPane.prototype.registerEvents = function() {
  var self = this;
  this.buttons.forEach(function(element, key) {
    element.onclick = function() {
      if(self.selected == key) {
        self.show(-1);
      } else {
        self.show(key);
      }
    }
  });
  this.update();
}

MenuPane.prototype.show = function(index) {
  this.selected = index;
  this.update();
}

MenuPane.prototype.update = function() {
  this.buttons.forEach(function(element, key) {
    if(this.selected == key) {
      element.className = 'menu-btn selected';
    } else {
      element.className = 'menu-btn';
    }
  }, this);
  this.panes.forEach(function(element, key) {
    if(this.selected == key) {
      element.style.display = 'block';
    } else {
      element.style.display = 'none';
    }
  }, this);
}

module.exports = MenuPane;

},{}],12:[function(require,module,exports){
var Hangul = require('./hangul');

function Monitor(interpreter) {
  this.interpreter = interpreter;
}

Monitor.prototype.getStatus = function() {
  var str = '';
  var state = this.interpreter.state;
  if (state.running) {
    var direction = state.direction;
    str += '실행 중 (위치 ' + state.x + ', ' + state.y + ')\n';
  } else {
    str += '실행 끝\n';
  }
  for (var i = 0; i < 28; ++i) {
    if (state.selected == i) {
      str += '>> ';
    }
    str += Hangul.final[i] + ': ';
    str += state.memory[i].data.join(' ');
    str += '\n';
  }
  return str;
};

module.exports = Monitor;
},{"./hangul":5}],13:[function(require,module,exports){
var TileMap = require('./tilemap');
var Hangul = require('./hangul');

var DirectionMap = {
  // Move cursor to the direction
  'ㅗ': 'up',
  'ㅓ': 'left',
  'ㅏ': 'right',
  'ㅜ': 'down',
  // Move cursor twice to the direction
  'ㅛ': 'skip-up',
  'ㅕ': 'skip-left',
  'ㅑ': 'skip-right',
  'ㅠ': 'skip-down',
  // Reverse direction if origin direction is up or down
  'ㅡ': 'horizontal',
  // Reverse direction if origin direction is left or right
  'ㅣ': 'vertical',
  // Reverse direction
  'ㅢ': 'reverse',
  'ㅐㅔㅒㅖㅘㅙㅚㅝㅞㅟ': 'none'
};

var DirectionReverseMap = {};
Object.keys(DirectionMap).forEach(function(k) {
  DirectionReverseMap[DirectionMap[k]] = k;
});

var CommandMap = {
  // ㅇ 묶음
  'ㅇㄱㄲㅉㅋ': 'none',
  'ㅎ': 'end',
  // ㄷ 묶음 - 셈
  'ㄷ': 'add',
  'ㄸ': 'multiply',
  'ㅌ': 'subtract',
  'ㄴ': 'divide',
  'ㄹ': 'mod',
  // ㅁ 묶음 - 저장공간
  'ㅁ': 'pop',
  'ㅂ': 'push',
  'ㅃ': 'copy',
  'ㅍ': 'flip',
  // ㅅ 묶음 - 제어, 저장공간 확장
  'ㅅ': 'select',
  'ㅆ': 'move',
  'ㅈ': 'compare',
  'ㅊ': 'condition'
};

var CommandReverseMap = {};
Object.keys(CommandMap).forEach(function(k) {
  CommandReverseMap[CommandMap[k]] = k;
});

var LineMap = {
  ' ': 0,
  'ㄱ': 2,
  'ㄴ': 2,
  'ㄷ': 3,
  'ㄹ': 5,
  'ㅁ': 4,
  'ㅂ': 4,
  'ㅅ': 2,
  'ㅈ': 3,
  'ㅊ': 4,
  'ㅋ': 3,
  'ㅌ': 4,
  'ㅍ': 4,
  'ㄲ': 4,
  'ㄳ': 4,
  'ㄵ': 5,
  'ㄶ': 5,
  'ㄺ': 7,
  'ㄻ': 9,
  'ㄼ': 9,
  'ㄽ': 7,
  'ㄾ': 9,
  'ㄿ': 9,
  'ㅀ': 8,
  'ㅄ': 6,
  'ㅆ': 4
};

var LineReverseMap = {};
Object.keys(LineMap).forEach(function(k) {
  if(LineReverseMap[LineMap[k]] == null) {
    LineReverseMap[LineMap[k]] = '';
  }
  LineReverseMap[LineMap[k]] += k;
});

function isHangul(code) {
  return 0xAC00 <= code && code <= 0xD7A3;
}

function parseSyllable(char) {
  var data = {
    direction: 'none',
    command: 'none',
    original: char
  };
  var code = char.charCodeAt();
  // Validate input, Making sure it's a Hangul character
  if (!isHangul(code)) return data;
  // Extract consonants and vowel from the character
  code -= Hangul.code;
  var finalCode = code % Hangul.final.length;
  var final = Hangul.final[finalCode];
  code = code / Hangul.final.length | 0;
  var medialCode = code % Hangul.medial.length;
  var medial = Hangul.medial[medialCode];
  code = code / Hangul.medial.length | 0;
  var initialCode = code % Hangul.initial.length;
  var initial = Hangul.initial[initialCode];
  // Parse direction and type
  data.direction = DirectionMap[medial] || data.direction;
  data.command = CommandMap[initial] || data.command;
  // Handle special types
  if (data.command == 'push') {
    if (final == 'ㅇ') data.command = 'push-number';
    else if (final == 'ㅎ') data.command = 'push-unicode';
    else data.data = LineMap[final];
  }
  if (data.command == 'pop') {
    if (final == 'ㅇ') data.command = 'pop-number';
    else if (final == 'ㅎ') data.command = 'pop-unicode';
  }
  if (data.command == 'select' || data.command == 'move') {
    data.data = finalCode;
  }
  return data;
}

function encodeSyllable(data) {
  var initial = getRandomChar(CommandReverseMap[data.command]||'');
  var medial = getRandomChar(DirectionReverseMap[data.direction]);
  var final = ' ';
  if (data.command == 'push-number') {
    initial = 'ㅂ';
    final = 'ㅇ';
  } else if (data.command == 'push-unicode') {
    initial = 'ㅂ';
    final = 'ㅎ';
  } else if (data.command == 'push') {
    final = getRandomChar(LineReverseMap[data.data || 0]);
  } else if (data.command == 'pop-number') {
    initial = 'ㅁ';
    final = 'ㅇ';
  } else if (data.command == 'pop-unicode') {
    initial = 'ㅁ';
    final = 'ㅎ';
  } else if (data.command == 'select' || data.command == 'move') {
    final = getRandomChar(Hangul.final[data.data || 0]);
  }
  var initialCode = Hangul.initial.indexOf(initial);
  var medialCode = Hangul.medial.indexOf(medial);
  var finalCode = Hangul.final.indexOf(final);
  var code = Hangul.code;
  code += initialCode * Hangul.medial.length * Hangul.final.length;
  code += medialCode * Hangul.final.length;
  code += finalCode;
  return String.fromCharCode(code);
}

function encode(map) {
  var code = "";
  for (var y = 0; y < map.height; ++y) {
    for (var x = 0; x < map.width; ++x) {
      var tile = map.get(x, y);
      if (tile) code += tile.original;
      else code += 'ㅇ';
    }
    code += '\n';
  }
  return code.slice(0, -1);
}

function getRandomChar(n) {
  return n.charAt(n.length * Math.random() | 0);
}

function parse(data) {
  var lines = data.split('\n');
  var map = new TileMap(0, lines.length);
  for (var y = 0; y < lines.length; ++y) {
    var line = lines[y].split('');
    map.expand(line.length, 0);
    for (var x = 0; x < line.length; ++x) {
      map.set(x, y, parseSyllable(line[x]));
    }
  }
  return map;
}

module.exports.parseSyllable = parseSyllable;
module.exports.parse = parse;
module.exports.encodeSyllable = encodeSyllable;
module.exports.encode = encode;

},{"./hangul":5,"./tilemap":20}],14:[function(require,module,exports){
function Playback(interpreter, renderer, callback, resetCallback) {
  this.interpreter = interpreter;
  this.renderer = renderer;
  this.callback = callback;
  this.resetCallback = resetCallback;
  this.running = false;
  this.playing = false;
  this.intervalId = -1;
  this.delay = 400;
  this.times = 1;
  this.registerEvents();
}

Playback.prototype.resetInterval = function() {
  var self = this;
  if(this.intervalId != -1) clearInterval(this.intervalId);
  this.intervalId = setInterval(function() {
    if (!self.running) return;
    self.step();
  }, this.delay);
}

Playback.prototype.updateDelay = function(id) {
  var element = document.getElementById('icon-play'+id+'x');
  if(this.preElement) {
    this.preElement.className = 'icon';
    this.preElement = element;
  }
  element.className = 'icon selected';
  // Reset timing
  this.times = 1;
  if(id == 1) this.delay = 400;
  if(id == 2) this.delay = 20;
  if(id == 3) {
    this.delay = 20;
    this.times = 10;
  }
  this.resetInterval();
}

Playback.prototype.registerEvents = function() {
  var self = this;
  // TODO let's not use getElementById in classes
  document.getElementById('icon-play').onclick = function() {
    document.activeElement.blur();
    self.playing = true;
    self.running = true;
    self.update();
  };
  document.getElementById('icon-pause').onclick = function() {
    document.activeElement.blur();
    if(!self.playing) return;
    self.running = false;
    self.update();
  };
  document.getElementById('icon-step').onclick = function() {
    document.activeElement.blur();
    self.playing = true;
    self.step(true);
    self.running = false;
    self.update();
  };
  document.getElementById('icon-stop').onclick = function() {
    self.playing = false;
    self.running = false;
    self.resetCallback();
    self.update();
  };
  document.getElementById('icon-play1x').onclick =
    this.updateDelay.bind(this, 1);
  document.getElementById('icon-play2x').onclick =
    this.updateDelay.bind(this, 2);
  document.getElementById('icon-play3x').onclick =
    this.updateDelay.bind(this, 3);
  this.preElement = document.getElementById('icon-play1x');
  this.resetInterval();
  self.update();
}

Playback.prototype.update = function() {
  // TODO PLEASE CLEANUP THIS CODE
  if(this.playing) {
    // Stop button is enabled
    document.getElementById('icon-stop').className = 'icon';
    if(this.running) {
      // Play button is selected
      document.getElementById('icon-play').className = 'icon selected';
      document.getElementById('icon-pause').className = 'icon';
      document.getElementById('icon-step').className = 'icon disabled';
    } else {
      // Pause button is selected
      document.getElementById('icon-play').className = 'icon';
      document.getElementById('icon-pause').className = 'icon selected';
      document.getElementById('icon-step').className = 'icon';
    }
  } else {
    // Stop, pause button is disabled
    document.getElementById('icon-stop').className = 'icon disabled';
    document.getElementById('icon-play').className = 'icon';
    document.getElementById('icon-pause').className = 'icon disabled';
  }
}

Playback.prototype.step = function(once) {
  if(!this.interpreter || !this.renderer) return;
  for(var i = 0; i < this.times; ++i) {
    this.interpreter.next();
    if(this.interpreter.state.breakpoint) {
      this.running = false;
      this.update();
      break;
    }
    if(!this.interpreter.state.running) {
      this.running = false;
      this.stopped = true;
      this.update();
      break;
    }
    if(once) break;
  }
  this.renderer.render();
  if(this.callback) this.callback();
}

module.exports = Playback;

},{}],15:[function(require,module,exports){
var parser = require('./parser');
var TileMap = require('./tilemap');
var Direction = require('./direction');
var Interpreter = require('./interpreter');

function Cursor(cursor) {
  this.id = cursor.id;
  this.segment = cursor.segment;
  this.x = cursor.x;
  this.y = cursor.y;
  this.direction = {};
  this.direction.x = cursor.direction.x;
  this.direction.y = cursor.direction.y;
  this.selected = cursor.selected;
  this.memory = cursor.memory.slice(); // Copy machine state.
  this.seek = cursor.seek || false;
  this.merge = true;
  this.visit = 0;
}

// Returns initial machine cursor
Cursor.init = function() {
  var initialMemory = [];
  for(var i = 0; i < 28; ++i) initialMemory.push(0);
  return new Cursor({
    id: 0,
    segment: 0,
    x: 0,
    y: 0,
    direction: {
      x: 0,
      y: 1
    },
    selected: 0,
    memory: initialMemory
  });
}

// Calculates memory diff
Cursor.prototype.diff = function(other) {
  return this.memory.map(function(value, key) {
    return value - other.memory[key];
  });
}

// Predicts the path of the code

function Predictor(code) {
  if (typeof code == 'string') {
    this.map = parser.parse(code);
  } else {
    this.map = code;
  }
  // Create segment heading map
  this.reset();
  this.updated = [];
}

Predictor.prototype.reset = function() {
  this.segments = [];
  this.mergeCandidates = [];
  this.stack = [];
  this.headingMap = new TileMap(this.map.width, this.map.height);
  var cursor = Cursor.init();
  var segment = [];
  segment.push(cursor);
  this.segments.push(segment);
  this.stack.push(cursor);
}

Predictor.prototype.postCheck = function() {
  // Merge candidates if possible
  while(this.mergeCandidates.length) {
    var candidate = this.mergeCandidates.shift();
    // Continue if cannot merge
    if(!candidate.merge) continue;
    var segment = this.segments[candidate.segment];
    while(candidate.otherwiseSet.length) {
      var target = candidate.otherwiseSet.shift();
      var targetSeg = this.segments[target.segment];
      // Set 'previous' direction
      var direction = candidate.direction;
      var preDir = Direction.convertToBits(-direction.x, -direction.y);
      // Process only if candidate's segment is lower
      if(candidate.segment >= target.segment) continue;
      // We have to process target...
      if(targetSeg.length == 0) {
        targetSeg.push(target);
      }
      // Pop segment
      var cursor;
      while(targetSeg.length) {
        cursor = targetSeg.shift();
        // Reset segment and id
        cursor.segment = candidate.segment;
        cursor.id = segment.length;
        segment.push(cursor);
        // Go back, and redraw
        if(cursor.before) {
          Direction.process({
            x: cursor.before.x,
            y: cursor.before.y
            }, this.map, cursor.direction, preDir, this.updated,
            cursor.segment);
        }
        // Set 'previous' direction
        direction = cursor.direction;
        preDir = Direction.convertToBits(-direction.x, -direction.y);
      }
    }
    if(cursor.then) {
      Direction.process({
        x: cursor.x,
        y: cursor.y
        }, this.map, cursor.then.direction, preDir, this.updated,
        cursor.segment);
    }
    // Mark it as cannot merge as it has already processed
    candidate.merge = false;
  }
}

Predictor.prototype.next = function() {
  if (this.stack.length === 0) return false;
  // Store previous cursor.. I doubt it'll be used actually.
  var oldCursor = this.stack.pop();
  var cursor = new Cursor(oldCursor);
  cursor.before = oldCursor;
  if(!cursor.seek) oldCursor.then = cursor;
  // Fetch current segment
  var segment = this.segments[cursor.segment];
  var direction = cursor.direction;
  // Store previous reversed direction
  var preDir = Direction.convertToBits(-direction.x, -direction.y);
  var tile = this.map.get(cursor.x, cursor.y);
  var headingTile = this.headingMap.get(cursor.x, cursor.y);
  // Create headingTile if not exists.
  if (headingTile == null) {
    headingTile = {};
    this.headingMap.set(cursor.x, cursor.y, headingTile);
  }
  // Continues execution in new segment if this is set.
  var newSegment = false;
  // Stop execution if this is set.
  var stop = false;
  if (tile != null) {
    // Fetch x, y value from tile's direction
    var tileDir = Direction.map[tile.direction];
    // Calculate the direction where the cursor will go
    direction.x = Direction.calculate(direction.x, tileDir.x);
    direction.y = Direction.calculate(direction.y, tileDir.y);
    // Fetch command
    var command = Interpreter.CommandMap[tile.command];
    // Just skip if command is null
    if(command != null) {
      if(cursor.memory[cursor.selected] >= command.data) {
        cursor.memory[cursor.selected] -= command.data; // Data we lose
        cursor.memory[cursor.selected] += command.output; // Data we get
        if (tile.command == 'select') {
          cursor.selected = tile.data;
        }
        if (tile.command == 'move') {
          cursor.memory[tile.data] ++;
        }
        if (tile.command == 'end') {
          // End of segment; Stop processing.
          // Techincally 'end' operator requires one data to stop,
          // But most programs won't work with that.
          stop = true;
        }
        if (tile.command == 'condition') {
          // Condition; Always create new segment.
          // Simply create new cursor with new segment, flip direction,
          // move position and save it.
          var newCursor = new Cursor(cursor);
          newCursor.direction.x = -direction.x;
          newCursor.direction.y = -direction.y;
          oldCursor.otherwise = newCursor;
          this.processCursor(newCursor, segment, tile, headingTile,
            stop, true, preDir);
        }
        // It can't be mergeable since original path has not stopped
        oldCursor.merge = false;
      } else {
        // Underflow has occurred; Go to opposite direction.
        direction.x = -direction.x;
        direction.y = -direction.y;
        // For consistency, this should create a new segment;
        // But it can probably be merged.
        newSegment = true;
        // Saving this for good measure
        if(!oldCursor.seek) {
          if(!oldCursor.otherwiseSet) {
            oldCursor.otherwiseSet = [];
            this.mergeCandidates.push(oldCursor);
          }
          oldCursor.otherwiseSet.push(cursor);
        }
      }
    }
  }
  this.processCursor(cursor, segment, tile, headingTile,
    stop, newSegment, preDir);
  return this.stack.length > 0;
};

Predictor.prototype.processCursor = function(cursor, segment, tile, headingTile,
  stop, newSegment, preDir) {
  // Don't save current cursor and increment it if this is set.
  var seek = false;
  var direction = cursor.direction;
  var directionBits = Direction.convertToBits(direction.x, direction.y, true);
  var before;
  if (headingTile[directionBits]) {
    before = headingTile[directionBits];
    before.visit ++;
    // Continue cursor in seek mode if memory has less data than before.
    var hasLess = !cursor.memory.every(function(value, key) {
      var diff = before.memory[key] - value;
      // Maximum memory space
      if(diff <= 0 && value >= 8) cursor.memory[key] = 8;
      // Check 16 times, then just check if it has less data.
      if(before.visit > 16) return diff <= 0;
      else return diff == 0;
    });
    before.memory = cursor.memory.slice();
    seek = hasLess;
    if(!hasLess) stop = true;
  }
  // 'newSegment' should set their ID before drawing path.
  if(before && newSegment) {
    cursor.id = before.id;
    cursor.segment = before.segment;
  }
  if (!stop) {
    if(!seek) {
      if (newSegment) {
        cursor.id = -1;
        cursor.segment = this.segments.length;
        segment = [];
        this.segments.push(segment);
      }
      // Increment cursor id to avoid confliction
      cursor.id ++;
      // Insert segment into segment.
      segment.push(cursor);
      // Write current cursor;
      headingTile[directionBits] = cursor;
    }
    // Push current cursor to stack.
    this.stack.push(cursor);
  }
  // Since this is the copy of original object, we can safely modify it.
  // This communicates with the 'old' data protocol, for now.
  Direction.process(cursor, this.map, direction, preDir, this.updated,
    cursor.segment, false);
  // Copy segment and ID to honor condition
  // But 'merging' cursor shouldn't.
  // It may cause conflicts because it doesn't add itself to segments,
  // But it's prevented because it's not added to segment if seek is true
  if(before && seek) {
    cursor.id = before.id;
    cursor.segment = before.segment;
  }
  cursor.seek = seek;
}

// Assembly command map to support ashembly
var AssemblyMap = {
  'end': 'halt',
  'add': 'add',
  'multiply': 'mul',
  'subtract': 'sub',
  'divide': 'div',
  'mod': 'mod',
  'pop': 'pop',
  'pop-number': 'popnum',
  'pop-unicode': 'popchar',
  'push': 'push',
  'push-number': 'pushnum',
  'push-unicode': 'pushchar',
  'copy': 'dup',
  'flip': 'swap',
  'select': 'sel',
  'move': 'mov',
  'compare': 'cmp',
  'condition': 'brz'
};

// Converts code to Assembly. Just for fun! :D
Predictor.prototype.assembly = function() {
  var resolves = [];
  var labels = [];
  var codes = [];
  // Start reading code from segment 0, id 0
  for(var segmentId = 0; segmentId < this.segments.length; ++segmentId) {
    var segment = this.segments[segmentId];
    for(var id = 0; id < segment.length; ++id) {
      var cursor = segment[id];
      cursor.index = codes.length;
      var headingTile = this.headingMap.get(cursor.x, cursor.y);
      var tile = this.map.get(cursor.x, cursor.y);
      if(tile == null) continue;
      if(tile.command != 'none') {
        var command = Interpreter.CommandMap[tile.command];
        var flipBit = Direction.convertToBits(-cursor.direction.x,
          -cursor.direction.y, true);
        if(headingTile[flipBit]) {
          if(command.data > 0) {
            var code = ['brpop'+command.data, headingTile[flipBit]];
            codes.push(code);
            resolves.push(code);
          }
        }
        var code = [AssemblyMap[tile.command]];
        if(tile.command == 'push') code[1] = tile.data;
        if(tile.command == 'select') code[1] = tile.data;
        if(tile.command == 'move') code[1] = tile.data;
        if(tile.command == 'condition') {
          code[1] = cursor.otherwise;
          resolves.push(code);
        }
        codes.push(code);
      } else {
        if(id == segment.length - 1) {
          // Fetch x, y value from tile's direction
          var tileDir = Direction.map[tile.direction];
          // Calculate the direction where the cursor will go
          var dirX = Direction.calculate(cursor.direction.x, tileDir.x);
          var dirY = Direction.calculate(cursor.direction.y, tileDir.y);
          var dirBit = Direction.convertToBits(dirX, dirY, true);
          var targetTile = headingTile[dirBit];
          if(!targetTile) continue;
          var code = ['jmp', targetTile];
          codes.push(code);
          resolves.push(code);
        }
      }
    }
  }
  for(var i = 0; i < resolves.length; ++i) {
    var idx = resolves[i][1].index;
    if(labels.indexOf(idx) == -1) labels.push(idx);
    resolves[i][1] = 'p'+labels.indexOf(idx);
  }
  var returned = [];
  codes.forEach(function(v, k) {
    var label = labels.indexOf(k);
    if(label != -1) {
      returned.push(":p"+label);
    }
    returned.push(v.join(' '));
  });
  console.log(returned.join("\n"));
}

module.exports = Predictor;

},{"./direction":4,"./interpreter":7,"./parser":13,"./tilemap":20}],16:[function(require,module,exports){
var TileMap = require('./tilemap');
var CanvasLayer = require('./canvaslayer');
var Hangul = require('./hangul');
var SpriteLoader = require('./spriteloader');

var SPRITE_SIZE = 100;

var arrowMap = {
  up: [2, 0],
  left: [2, 1],
  right: [3, 0],
  down: [3, 1],
  'skip-up': [2, 2],
  'skip-left': [2, 3],
  'skip-right': [3, 2],
  'skip-down': [3, 3],
  none: [0, 0],
  horizontal: [1, 0],
  vertical: [1, 1],
  reverse: [0, 1]
};

var pathMap = {
  'up': [2, 1],
  'left': [1, 2],
  'right': [3, 0],
  'down': [2, 2],
  'up-left': [1, 1],
  'up-right': [0, 2],
  'down-left': [2, 0],
  'down-right': [0, 0],
  'horizontal': [1, 0],
  'vertical': [0, 1],
  'skip-horizontal': [3, 1],
  'skip-vertical': [3, 2]
};

var segmentMap = [
  [0, 0],
  [1, 0],
  [0, 1],
  [1, 1],
  [0, 2],
  [1, 2]
];

var commandMap = {
  'none': [0, 0],
  'end': [1, 0],
  'add': [2, 0],
  'multiply': [3, 0],
  'subtract': [2, 1],
  'divide': [3, 1],
  'mod': [1, 1],
  'push': [0, 1],
  'push-unicode': [4, 1],
  'push-number': [4, 0],
  'pop': [0, 2],
  'pop-unicode': [4, 3],
  'pop-number': [4, 2],
  'copy': [1, 2],
  'flip': [2, 2],
  'select': [3, 2],
  'move': [0, 3],
  'compare': [1, 3],
  'condition': [2, 3],
  'breakpoint': [3, 3]
};

// http://stackoverflow.com/a/3368118/3317669
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof stroke == "undefined") {
    stroke = true;
  }
  if (typeof radius === "undefined") {
    radius = 5;
  }
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (stroke) {
    ctx.stroke();
  }
  if (fill) {
    ctx.fill();
  }
}

var Renderer = function(viewport, interpreter, width) {
  var self = this;

  this.interpreter = interpreter;
  this.map = interpreter.map;
  this.width = width || 50;

  this.canvases = new CanvasLayer(viewport, ['background', 'highlight', 'text',
    'path', 'arrow', 'command'],
    this.width * (this.map.width + 1), this.width * (this.map.height + 1));

  this.sprites = new SpriteLoader(function() {
    self.reset();
  });

  this.sprites.load('path', 'img/path.png');
  this.sprites.load('arrow', 'img/arrow.png');
  this.sprites.load('command', 'img/command.png');
};

Renderer.prototype.reset = function() {
  this.cacheMap = new TileMap(this.interpreter.map.width + 1,
    this.interpreter.map.height + 1);
  this.canvases.setSize(this.width * (this.interpreter.map.width + 1),
    this.width * (this.interpreter.map.height + 1));
  this.canvases.forEach(function(ctx) {
    ctx.font = (this.width * 0.6) + "px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#000";
  }, this);
  this.canvases.get('background').fillRect(0, 0,
    this.canvases.width, this.canvases.height);
  this.canvases.get('text').fillStyle = "#555";
  // Redraw all tiles
  for (var y = 0; y <= this.interpreter.map.height; ++y) {
    for (var x = 0; x <= this.interpreter.map.width; ++x) {
      this.cacheMap.set(x, y, {});
      this.updateTile(x, y);
    }
  }
};

Renderer.prototype.redraw = function() {
  // Redraw all tiles
  for (var y = 0; y <= this.interpreter.map.height; ++y) {
    for (var x = 0; x <= this.interpreter.map.width; ++x) {
      this.updateTile(x, y);
    }
  }
};

Renderer.prototype.updateTile = function(x, y) {
  var state = this.interpreter.state;
  var tile = this.interpreter.map.get(x, y);
  var cacheTile = this.cacheMap.get(x, y);
  
  this.canvases.forEach(function(ctx) {
    ctx.save();
    ctx.translate(x * this.width, y * this.width);
  }, this);

  var highlighted = state && state.x == x && state.y == y;
  if (cacheTile.highlighted != highlighted) {
    cacheTile.highlighted = highlighted;
    var highlightCtx = this.canvases.get('highlight');
    highlightCtx.clearRect(0, 0, this.width, this.width);
    if (highlighted) {
      highlightCtx.fillStyle = "#666";
    } else {
      highlightCtx.fillStyle = "#222";
    }
    roundRect(highlightCtx, 1, 1, this.width - 2, this.width - 2, 4, true);
  }
  
  if (tile) {
    if (cacheTile.text != tile.original) {
      cacheTile.text = tile.original;
      var textCtx = this.canvases.get('text');
      textCtx.clearRect(0, 0, this.width, this.width);
      textCtx.fillText(tile.original, this.width / 2, this.width / 2);
    }

    if (tile.directions && (cacheTile.directions != Object.keys(tile.directions).length)) {
      cacheTile.directions = Object.keys(tile.directions).length;
      this.canvases.get('path').clearRect(0, 0, this.width, this.width);
      for(var id = tile.directions.length - 1; id >= 0; --id) {
        var paths = tile.directions[id];
        if(paths == null) continue;
        paths.forEach(function(direction) {
          var segment = segmentMap[id % 6];
          var pathPos = pathMap[direction];
          var pathImg = this.sprites.get('path');
          this.canvases.get('path').drawImage(pathImg, 
            (segment[0] * 4 + pathPos[0]) * SPRITE_SIZE, 
            (segment[1] * 3 + pathPos[1]) * SPRITE_SIZE,
            SPRITE_SIZE, SPRITE_SIZE, 0, 0, this.width, this.width);
        }, this);
      }
    }

    if (cacheTile.direction != tile.direction) {
      cacheTile.direction = tile.direction;
      var arrowCtx = this.canvases.get('arrow');
      arrowCtx.clearRect(0, 0, this.width, this.width);
      var arrowPos = arrowMap[tile.direction];
      arrowCtx.drawImage(this.sprites.get('arrow'),
        arrowPos[0] * SPRITE_SIZE, arrowPos[1] * SPRITE_SIZE,
        SPRITE_SIZE, SPRITE_SIZE, 0, 0, this.width, this.width);
    }

    if (cacheTile.command != tile.command || cacheTile.data != tile.data
      || cacheTile.breakpoint != tile.breakpoint) {
      cacheTile.command = tile.command;
      cacheTile.data = tile.data;
      cacheTile.breakpoint = tile.breakpoint;
      var commandCtx = this.canvases.get('command');
      var commandPos = commandMap[tile.command];
      commandCtx.clearRect(0, 0, this.width, this.width);
      commandCtx.drawImage(this.sprites.get('command'),
        commandPos[0] * SPRITE_SIZE, commandPos[1] * SPRITE_SIZE,
        SPRITE_SIZE, SPRITE_SIZE, 0, 0, this.width, this.width);
      if (tile.breakpoint) {
        commandPos = commandMap['breakpoint'];
        commandCtx.drawImage(this.sprites.get('command'),
          commandPos[0] * SPRITE_SIZE, commandPos[1] * SPRITE_SIZE,
          SPRITE_SIZE, SPRITE_SIZE, 0, 0, this.width, this.width);
      }
      if (tile.data != null) {
        var text = '';
        if (tile.command == 'push') text = tile.data;
        if (tile.command == 'select') text = Hangul.final[tile.data];
        if (tile.command == 'move') text = Hangul.final[tile.data];
        commandCtx.font = (this.width * 0.3) + "px sans-serif";
        commandCtx.textAlign = "right";
        commandCtx.textBaseline = "bottom";
        commandCtx.fillStyle = "#fff";
        commandCtx.fillText(text, this.width - 3, this.width - 3);
      }
    }
  }
  this.canvases.forEach(function(ctx) {
    ctx.restore();
  }, this);
};

Renderer.prototype.render = function() {
  var state = this.interpreter.state;
  while (this.interpreter.updated.length > 0) {
    var pos = this.interpreter.updated.shift();
    this.updateTile(pos.x, pos.y);
  }
  if (state) this.updateTile(state.x, state.y);
};

module.exports = Renderer;

},{"./canvaslayer":2,"./hangul":5,"./spriteloader":18,"./tilemap":20}],17:[function(require,module,exports){
function ScrollPane(viewport, clickCallback) {
  this.viewport = viewport;
  this.clickCallback = clickCallback;
  this.registerEvents();
  this.tolerance = 6;
}

ScrollPane.prototype.registerEvents = function() {
  var self = this;
  var prevX = 0;
  var prevY = 0;
  var moveX = 0;
  var moveY = 0;
  function handleMouseUp(e) {
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('mousemove', handleMouseMove);
    if (Math.abs(moveX) < self.tolerance && Math.abs(moveY) < self.tolerance
      && self.clickCallback) {
      self.clickCallback(e);
    }
    return false;
  }
  function handleMouseMove(e) {
    var diffX = e.pageX - prevX;
    var diffY = e.pageY - prevY;
    self.viewport.scrollTop -= diffY;
    self.viewport.scrollLeft -= diffX;
    moveX -= diffX;
    moveY -= diffY;
    prevX = e.pageX;
    prevY = e.pageY;
  }
  this.viewport.addEventListener('mousedown', function(e) {
    prevX = e.pageX;
    prevY = e.pageY;
    moveX = 0;
    moveY = 0;
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);
    e.preventDefault();
    return false;
  });
}

module.exports = ScrollPane;

},{}],18:[function(require,module,exports){
function SpriteLoader(callback) {
  this.sprites = [];
  this.loadCount = 0;
  this.callback = callback;
}

SpriteLoader.prototype.get = function(name) {
  return this.sprites[name];
}

SpriteLoader.prototype.load = function(name, src) {
  var img = new Image();
  img.src = src;
  img.onload = (function() {
    this.sprites[name] = img;
    this.handleDone();
  }).bind(this);
  this.loadCount ++;
}

SpriteLoader.prototype.handleDone = function() {
  this.loadCount --;
  if(this.loadCount == 0) {
    if(this.callback) this.callback();
  }
}

module.exports = SpriteLoader;

},{}],19:[function(require,module,exports){
var TileMap = require('./tilemap');

function Table(viewport, tilemap, updateCallback) {
  this.viewport = viewport;
  this.tilemap = tilemap;
  this.updateCallback = updateCallback;
  this.reset();
}

Table.prototype.reset = function() {
  this.domMap = new TileMap(this.tilemap.width, this.tilemap.height);
  this.createNodes();
}

Table.prototype.createNodes = function() {
  // Clear nodes in viewport
  while(this.viewport.firstChild) {
    this.viewport.removeChild(this.viewport.firstChild);
  }
  // Add nodes in viewport
  for(var y = 0; y < this.domMap.height; ++y) {
    var row = document.createElement('tr');
    this.viewport.appendChild(row);
    for(var x = 0; x < this.domMap.width; ++x) {
      var column = document.createElement('td');
      row.appendChild(column);
      column.tx = x;
      column.ty = y;
      this.domMap.set(x, y, column);
      this.updateNode(x, y);
    }
  }
}

Table.prototype.updateNode = function(x, y) {
  var node = this.domMap.get(x, y);
  var tile = this.tilemap.get(x, y);
  this.updateCallback(node, tile, x, y);
}

module.exports = Table;

},{"./tilemap":20}],20:[function(require,module,exports){
function TileMap(width, height) {
  this.width = width;
  this.height = height;
  this.map = null;
  this.clear();
}

TileMap.prototype.clear = function() {
  this.map = [];
  for (var y = 0; y < this.height; ++y) {
    var row = [];
    for (var x = 0; x < this.width; ++x) {
      row[x] = null;
    }
    this.map[y] = row;
  }
};

TileMap.prototype.expand = function(width, height) {
  var x, y, row;
  var prevWidth = this.width;
  var prevHeight = this.height;
  if (width > this.width) this.width = width;
  if (height > this.height) this.height = height;
  for (y = 0; y < prevHeight; ++y) {
    row = this.map[y];
    for (x = prevWidth; x < this.width; ++x) {
      row[x] = null;
    }
  }
  for (y = prevHeight; y < this.height; ++y) {
    row = [];
    for (x = 0; x < this.width; ++x) {
      row[x] = null;
    }
    this.map[y] = row;
  }
};

TileMap.prototype.get = function(x, y) {
  if (y < 0 || y >= this.height) return null;
  if (x < 0 || x >= this.width) return null;
  return this.map[y][x];
};

TileMap.prototype.set = function(x, y, data) {
  if (y < 0 || y >= this.height) throw new Error('TileMap out of bounds');
  if (x < 0 || x >= this.width) throw new Error('TileMap out of bounds');
  this.map[y][x] = data;
};

TileMap.prototype.transpose = function() {
  var tileMap = new TileMap(this.height, this.width);
  for(var y = 0; y < this.width; ++y) {
    for(var x = 0; x < this.height; ++x) {
      tileMap.set(x, y, this.get(y, x));
    }
  }
  return tileMap;
}

TileMap.fromArray = function(arr) {
  var tileMap = new TileMap(0, arr.length);
  for(var y = 0; y < arr.length; ++y) {
    tileMap.expand(arr[y].length, 0);
    for(var x = 0; x < arr[y].length; ++x) {
      tileMap.set(x, y, arr[y][x]);
    }
  }
  return tileMap;
}

module.exports = TileMap;

},{}],21:[function(require,module,exports){
var Keyboard = require('./keyboard');
var TileMap = require('./tilemap');
var Table = require('./table');

function ToolBox(renderer) {
  this.selected = {
    type: 'arrow',
    name: 'none'
  };
  this.oldNode = null;
  this.renderer = renderer;
  this.scrollPane = null;
  this.generateTable();
}

ToolBox.prototype.generateTable = function() {
  var self = this;
  var tilemap = new TileMap(0, Keyboard.KeyShiftLayout.length);
  for(var y = 0; y < tilemap.height; ++y) {
    tilemap.expand(Keyboard.KeyShiftLayout[y].length, 0);
    for(var x = 0; x < Keyboard.KeyShiftLayout[y].length; ++x) {
      var key = Keyboard.KeyShiftLayout[y][x];
      tilemap.set(x, y, {
        value: Keyboard.EditorKeyMapping[key],
        key: key
      });
    }
  }
  // TODO no getElementById in class
  var viewport = document.getElementById('toolbox-table');
  this.table = new Table(viewport, tilemap, function(node, tile) {
    if(!tile || !tile.value) {
      node.parentNode.removeChild(node);
      return;
    }
    // ID is not required anymore, actually
    node.id = tile.value.join('-');
    node.className = tile.value[0];
    node.appendChild(document.createTextNode(tile.key));
    node.addEventListener('click', function() {
      self.changeSelected.apply(self, tile.value);
    });
  });
}

ToolBox.prototype.changeSelected = function(type, name) {
  // Invalidate old object
  if(this.oldNode) this.oldNode.className = this.selected.type;
  // Update
  this.selected.type = type;
  this.selected.name = name;
  var btn = document.getElementById(type + '-' + name);
  btn.className = type + ' selected';
  this.oldNode = btn;
};

module.exports = ToolBox;

},{"./keyboard":8,"./table":19,"./tilemap":20}],22:[function(require,module,exports){
// Saves undo stack and preforms undo
function UndoMachine(callback) {
  this.undoStack = [];
  this.redoStack = [];
  this.callback = callback;
}

UndoMachine.prototype.run = function(action) {
  // Clear redo stack, as it becomes unusable
  this.redoStack = [];
  // Execute action...
  action.exec();
  this.undoStack.push(action);
  if(this.callback) this.callback();
}

UndoMachine.prototype.canUndo = function() {
  return this.undoStack.length >= 1;
}

UndoMachine.prototype.undo = function() {
  if(!this.canUndo()) return false;
  // Undo action and push to redo stack
  var action = this.undoStack.pop();
  action.undo();
  this.redoStack.push(action);
  if(this.callback) this.callback();
  return action;
}

UndoMachine.prototype.canRedo = function() {
  return this.redoStack.length >= 1;
}

UndoMachine.prototype.redo = function() {
  if(!this.canRedo()) return false;
  // Redo action and push to undo stack..
  var action = this.redoStack.pop();
  action.exec();
  this.undoStack.push(action);
  if(this.callback) this.callback();
  return action;
}

UndoMachine.prototype.reset = function() {
  this.undoStack = [];
  this.redoStack = [];
  if(this.callback) this.callback();
}

module.exports = UndoMachine;

},{}],23:[function(require,module,exports){
var ScrollPane = require('./scrollpane');
var TileAction = require('./action');
var parser = require('./parser');

function Viewport(element, toolbox, renderer, contextmenu, undomachine,
  checkCallback, clickCallback) {
  this.element = element;
  this.toolbox = toolbox;
  this.renderer = renderer;
  this.contextmenu = contextmenu;
  this.undomachine = undomachine;
  this.scrollpane = new ScrollPane(element, this.handleMouseClick.bind(this));
  this.checkCallback = checkCallback;
  this.clickCallback = clickCallback;
  this.hookEvents();
}

Viewport.prototype.hookEvents = function() {
  this.element.addEventListener('contextmenu', this.handleContext.bind(this));
}

Viewport.prototype.handleMouseClick = function(e) {
  // http://stackoverflow.com/a/5932203
  var totalOffsetX = 0;
  var totalOffsetY = 0;
  var canvasX = 0;
  var canvasY = 0;
  var currentElement = this.element;
  do {
    totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
    totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
    currentElement = currentElement.offsetParent;
  } while (currentElement);
  totalOffsetX += this.renderer.canvases.viewport.offsetLeft;
  totalOffsetY += this.renderer.canvases.viewport.offsetTop;
  totalOffsetX += document.body.scrollLeft;
  totalOffsetY += document.body.scrollTop;
  canvasX = e.pageX - totalOffsetX;
  canvasY = e.pageY - totalOffsetY;
  e.preventDefault();
  var tileX = canvasX / this.renderer.width | 0;
  var tileY = canvasY / this.renderer.width | 0;
  if (!this.checkCallback(tileX, tileY)) return false;
  // Ignore if we have to expand too much
  if(tileX < 0) return false;
  if(tileY < 0) return false;
  if(tileX > this.renderer.map.width) return false;
  if(tileY > this.renderer.map.height) return false;
  // Expand the map if required
  this.renderer.map.expand(tileX + 1, tileY + 1);
  if (tileX + 1 >= this.renderer.map.width ||
    tileY + 1 >= this.renderer.map.height) {
    this.renderer.reset();
  }
  var tile = this.renderer.map.get(tileX, tileY) || {
    direction: 'none',
    command: 'none',
    original: ' '
  };
  if(e.button == 0) {
    var selected = this.toolbox.selected;
    // Why is it 'arrow'? .... It'd be good if it was 'direction'.
    // ... to avoid Ctrl+C, V.
    if(selected.type == 'arrow') {
      this.undomachine.run(new TileAction(tile, tileX, tileY,
        {
          direction: selected.name
        }, this.renderer,
        this.clickCallback.bind(this, tileX, tileY, tile)));
    } else {
      this.undomachine.run(new TileAction(tile, tileX, tileY,
        {
          command: selected.name
        }, this.renderer,
        this.clickCallback.bind(this, tileX, tileY, tile)));
    }
  } else if(e.button == 2) {
    var contextX = tileX * this.renderer.width + totalOffsetX;
    var contextY = (tileY+1) * this.renderer.width + totalOffsetY;
    this.contextmenu.tileX = tileX;
    this.contextmenu.tileY = tileY;
    this.contextmenu.tile = tile;
    this.contextmenu.show(contextX, contextY);
  }
}

Viewport.prototype.handleContext = function(e) {
  e.preventDefault();
  return false;
}

module.exports = Viewport;

},{"./action":1,"./parser":13,"./scrollpane":17}]},{},[6]);

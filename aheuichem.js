(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
var Table = require('./table');
var TileMap = require('./tilemap');
var parser = require('./parser');

var PushKeyBinding = [
  [0, 2, 3, 4, 5],
  [6, 7, 8, 9, -1]
];

/*
 ㄱㄴㄷㄹㄲㄳㄵㄶ
ㅁㅂㅅㅇㅈㄺㄻㄼㄽ
ㅊㅋㅌㅍㅎㄾㄿㅀㅄㅆ
*/
var FinalKeyBinding = [
];

function ContextMenu(container, element, renderer, clickCallback) {
  this.container = container;
  this.element = element;
  this.hideEvent = this.hide.bind(this);
  this.init();
  this.renderer = renderer;
  this.clickCallback = clickCallback;
  this.tileX = null;
  this.tileY = null;
  this.tile = null;
}

ContextMenu.prototype.update = function() {
  this.tile.original = parser.encodeSyllable(this.tile);
  this.renderer.map.set(this.tileX, this.tileY, this.tile);
  this.renderer.updateTile(this.tileX, this.tileY);
  if(this.clickCallback) this.clickCallback(this.tileX, this.tileY, this.tile);
}

ContextMenu.prototype.init = function() {
  var self = this;
  // TODO should support generating tilemap from an array
  var tilemap = new TileMap(5, 2);
  for(var y = 0; y < tilemap.height; ++y) {
    for(var x = 0; x < tilemap.width; ++x) {
      tilemap.set(x, y, PushKeyBinding[y][x]);
    }
  }
  // TODO no getElementById in class
  // This is exactly same situation as toolbox
  var viewport = document.getElementById('push-table');
  var pushTable = new Table(viewport, tilemap, function(node, tile) {
    if(tile == null) {
      node.parentNode.removeChild(node);
      return;
    }
    node.id = 'push-table-'+tile;
    node.appendChild(document.createTextNode(tile));
    node.addEventListener('click', function() {
      self.tile.data = tile;
      self.update();
    });
  });
}

ContextMenu.prototype.show = function(x, y) {
  this.container.style.display = 'block';
  this.container.addEventListener('click', this.hideEvent);
  this.container.addEventListener('contextmenu', this.hideEvent);
  this.element.style.display = 'block';
  this.element.style.top = y+'px';
  this.element.style.left = x+'px';
}

ContextMenu.prototype.hide = function(e) {
  this.container.removeEventListener('click', this.hideEvent);
  this.container.removeEventListener('contextmenu', this.hideEvent);
  this.container.style.display = 'none';
  this.element.style.display = 'none';
  if(e) {
    e.preventDefault();
    return false;
  }
}

module.exports = ContextMenu;

},{"./parser":10,"./table":15,"./tilemap":16}],3:[function(require,module,exports){
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
  'down-right': DOWN | RIGHT
};

var DirectionBitRevMap = {};
Object.keys(DirectionBitMap).forEach(function(k) {
  DirectionBitRevMap[DirectionBitMap[k]] = k;
});

function process(pos, map, direction, preDir, updated, segment, unlikely) {
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
      write(skipTile, 'skip-horizontal', segment, unlikely);
    } else {
      write(skipTile, 'skip-vertical', segment, unlikely);
    }
  }
  // Move to tile
  updated.push({
    x: pos.x,
    y: pos.y
  });
  var bitDir = preDir | convertToBits(direction.x, direction.y);
  write(tile, DirectionBitRevMap[bitDir], segment, unlikely);
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
  if (pos < 0) pos = size + pos;
  if (pos >= size) pos = pos - size;
  return pos;
}

function convertToBits(x, y) {
  var val = 0;
  if (y <= -1) val |= UP;
  if (y >= 1) val |= DOWN;
  if (x <= -1) val |= LEFT;
  if (x >= 1) val |= RIGHT;
  return val;
}

function write(tile, direction, segment, unlikely) {
  if (tile == null) return;
  if (tile.directions == null) {
    tile.directions = {};
  }
  if (tile.directions[direction] == null) {
    tile.directions[direction] = {
      segment: segment,
      unlikely: unlikely
    };
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

},{}],4:[function(require,module,exports){
var Hangul = {
  initial: 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'.split(''),
  medial: 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'.split(''),
  final: ' ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'.split(''),
  code: 0xAC00
};

module.exports = Hangul;

},{}],5:[function(require,module,exports){
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

var interpreter;
var renderer;
var predictor;
var monitor;
var toolbox;
var viewport;
var contextmenu;
var playback;
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

},{"./contextmenu":2,"./interpreter":6,"./monitor":9,"./parser":10,"./playback":11,"./predictor":12,"./renderer":13,"./toolbox":17,"./viewport":18}],6:[function(require,module,exports){
var parser = require('./parser');
var memory = require('./memory');
var Direction = require('./direction');

var CommandMap = {
  'end': {
    data: 0,
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
    exec: function(tile, state, memory) {
      memory.pull();
    }
  },
  'pop-unicode': {
    data: 1,
    exec: function(tile, state, memory) {
      var data = memory.pull();
      state.output.push(String.fromCharCode(data));
    }
  },
  'pop-number': {
    data: 1,
    exec: function(tile, state, memory) {
      var data = memory.pull();
      state.output = state.output.concat(String(data).split(''));
    }
  },
  'push': {
    data: 0,
    exec: function(tile, state, memory) {
      memory.push(tile.data);
    }
  },
  'push-unicode': {
    data: 0,
    exec: function(tile, state, memory) {
      // TODO
      memory.push(0xAC00);
    }
  },
  'push-number': {
    data: 0,
    exec: function(tile, state, memory) {
      // TODO
      memory.push(123);
    }
  },
  'copy': {
    data: 1,
    exec: function(tile, state, memory) {
      memory.copy();
    }
  },
  'flip': {
    data: 2,
    exec: function(tile, state, memory) {
      memory.flip();
    }
  },
  'select': {
    data: 0,
    exec: function(tile, state, memory) {
      state.selected = tile.data;
    }
  },
  'move': {
    data: 1,
    exec: function(tile, state, memory) {
      var target = state.memory[tile.data];
      var data = memory.pull();
      target.push(data);
    }
  },
  'compare': {
    data: 2,
    exec: function(tile, state, memory) {
      var a = memory.pull();
      var b = memory.pull();
      memory.push(b >= a ? 1 : 0);
    }
  },
  'condition': {
    data: 1,
    exec: function(tile, state, memory) {
      var data = memory.pull();
      if (data === 0) return true;
    }
  }
};

function buildCalcCommand(callback) {
  return {
    data: 2,
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
    0);
  return this.state.running;
};

module.exports = Interpreter;

},{"./direction":3,"./memory":8,"./parser":10}],7:[function(require,module,exports){
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

var KeyMapping = {
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

function Keyboard(toolbox) {
  this.toolbox = toolbox;
  this.registerEvents();
}

Keyboard.prototype.registerEvents = function() {
  var self = this;
  document.addEventListener('keypress', function(e) {
    var keyPressed = e.key || String.fromCharCode(e.charCode);
    if(KeyMapping[keyPressed]) {
      var mapping = KeyMapping[keyPressed];
      self.toolbox.changeSelected(mapping[0], mapping[1]);
    }
  });
}

Keyboard.KeyLayout = KeyLayout;
Keyboard.KeyShiftLayout = KeyShiftLayout;
Keyboard.KeyMapping = KeyMapping;

module.exports = Keyboard;

},{}],8:[function(require,module,exports){
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
},{}],9:[function(require,module,exports){
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
},{"./hangul":4}],10:[function(require,module,exports){
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
  'ㅐ': 'none'
};

var DirectionReverseMap = {};
Object.keys(DirectionMap).forEach(function(k) {
  DirectionReverseMap[DirectionMap[k]] = k;
});

var CommandMap = {
  // ㅇ 묶음
  'ㅇ': 'none',
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
  LineReverseMap[LineMap[k]] = k;
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
  var initial = CommandReverseMap[data.command];
  var medial = DirectionReverseMap[data.direction];
  var final = ' ';
  // TODO randomize outputs
  if (data.command == 'push-number') {
    initial = 'ㅂ';
    final = 'ㅇ';
  } else if (data.command == 'push-unicode') {
    initial = 'ㅂ';
    final = 'ㅎ';
  } else if (data.command == 'push') {
    final = LineReverseMap[data.data || 0];
  } else if (data.command == 'pop-number') {
    initial = 'ㅁ';
    final = 'ㅇ';
  } else if (data.command == 'pop-unicode') {
    initial = 'ㅁ';
    final = 'ㅎ';
  } else if (data.command == 'select' || data.command == 'move') {
    final = Hangul.final[data.data || 0];
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

},{"./hangul":4,"./tilemap":16}],11:[function(require,module,exports){
function Playback(interpreter, renderer, callback, resetCallback) {
  this.interpreter = interpreter;
  this.renderer = renderer;
  this.callback = callback;
  this.resetCallback = resetCallback;
  this.running = false;
  this.registerEvents();
}

Playback.prototype.registerEvents = function() {
  var self = this;
  // TODO let's not use getElementById in classes
  document.getElementById('codeForm-resume').onclick = function() {
    self.running = true;
  };
  document.getElementById('codeForm-pause').onclick = function() {
    self.running = false;
  };
  document.getElementById('codeForm-step').onclick = function() {
    self.step();
    self.running = false;
  };
  document.getElementById('codeForm-reset').onclick = function() {
    self.resetCallback();
  };
  setInterval(function() {
    if (!self.running) return;
    self.step();
  }, 20);
}

Playback.prototype.step = function() {
  if(!this.interpreter || !this.renderer) return;
  this.interpreter.next();
  this.renderer.render();
  if(this.callback) this.callback();
}

module.exports = Playback;

},{}],12:[function(require,module,exports){
var parser = require('./parser');
var Direction = require('./direction');
// Predicts the path of the code
// TODO this requires some serious refactoring... really.

var ReversibleMap = {
  'condition': true,
  'add': true,
  'multiply': true,
  'subtract': true,
  'divide': true,
  'mod': true,
  'pop': true,
  'pop-unicode': true,
  'pop-number': true,
  'copy': true,
  'flip': true,
  'move': true,
  'compare': true
};

var UnlikelyMap = {
  'add': true,
  'multiply': true,
  'subtract': true,
  'divide': true,
  'mod': true,
  'pop': true,
  'pop-unicode': true,
  'pop-number': true,
  'copy': true,
  'flip': true,
  'move': true,
  'compare': true
};


function Predictor(code) {
  if (typeof code == 'string') {
    this.map = parser.parse(code);
  } else {
    this.map = code;
  }
  this.segmentId = 0;
  this.segments = {};
  this.stack = [{
    x: 0,
    y: 0,
    direction: {
      x: 0,
      y: 1
    },
    register: {
      x: 0,
      y: 0,
      preDir: 0
    }
  }];
  this.updated = [];
}

Predictor.prototype.next = function() {
  if (this.stack.length === 0) return false;
  var state = this.stack[this.stack.length - 1];
  if (state.register) {
    // Assign segment
    state.segment = this.segmentId++;
    this.segments[state.segment] = [];
    // Update the tile
    if (state.register.preDir) {
      Direction.process(state.register, this.map, state.direction,
        state.register.preDir, this.updated, state.segment, state.unlikely);
    }
    delete state.register;
  }
  var segment = this.segments[state.segment];
  var direction = state.direction;
  var preDir = Direction.convertToBits(-direction.x, -direction.y);
  var tile = this.map.get(state.x, state.y);
  var removal = false;
  if (segment) segment.push(tile);
  if (tile !== null) {
    if (!tile.segments) {
      tile.segments = {};
    }
    // Set the direction
    var tileDir = Direction.map[tile.direction];
    direction.x = Direction.calculate(direction.x, tileDir.x);
    direction.y = Direction.calculate(direction.y, tileDir.y);
    if (tile.command == 'end') removal = true;
    if (tile.segments[Direction.convertToBits(direction.x, direction.y)]) {
      removal = true;
    } else {
      tile.segments[Direction.convertToBits(direction.x, direction.y)] = {
        segment: state.segment,
        position: segment ? segment.length - 1 : 0
      };
    }
    if (!removal && ReversibleMap[tile.command]) {
      var flipDir = {
        x: -direction.x,
        y: -direction.y
      };
      var flipState = {
        x: Direction.move(state.x, flipDir.x, this.map.width),
        y: Direction.move(state.y, flipDir.y, this.map.height),
        direction: flipDir,
        unlikely: state.unlikely,
        register: {
          x: state.x,
          y: state.y,
          preDir: preDir
        }
      };
      var flipTile = this.map.get(flipState.x, flipState.y);
      var skip = false;
      if (flipTile) {
        var flipTileDir = Direction.map[flipTile.direction];
        if (flipTileDir.x == direction.x && flipTileDir.y == direction.y) {
          // It's useless; skipping
          skip = true;
        }
      }
      if (!skip && (!flipTile || !flipTile.segments ||
          !flipTile.segments[Direction.convertToBits(flipDir.x, flipDir.y)])) {
        if (UnlikelyMap[tile.command]) {
          flipState.unlikely = true;
          this.stack.unshift(flipState);
        } else {
          this.stack.push(flipState);
        }
      }
    }
  }
  Direction.process(state, this.map, direction, preDir, this.updated,
    state.segment, state.unlikely);
  if (removal) {
    this.stack.splice(this.stack.indexOf(state), 1);
    if (segment && segment.length <= 1) {
      delete this.segments[state.segment];
    }
  }
  return this.stack.length > 0;
};

module.exports = Predictor;

},{"./direction":3,"./parser":10}],13:[function(require,module,exports){
var TileMap = require('./tilemap');
var CanvasLayer = require('./canvaslayer');
var Hangul = require('./hangul');

// TODO is Array good method to do this?
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
  [1, 1]
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
  'condition': [2, 3]
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
  this.interpreter = interpreter;
  this.map = interpreter.map;
  this.width = width || 50;

  this.canvases = new CanvasLayer(viewport, ['background', 'highlight', 'text', 'path', 'arrow', 'command'],
    this.width * interpreter.map.width, this.width * interpreter.map.height);

  // TODO hold sprite sheets somewhere else and refactor code
  var loadCount = 4;
  var self = this;

  function handleLoad() {
    loadCount--;
    if (loadCount === 0) self.reset();
  }

  var pathImage = new Image();
  pathImage.src = 'img/path.png';
  pathImage.onload = handleLoad;
  this.pathImage = pathImage;

  var pathTransparentImage = new Image();
  pathTransparentImage.src = 'img/path_transparent.png';
  pathTransparentImage.onload = handleLoad;
  this.pathTransparentImage = pathTransparentImage;

  var arrowImage = new Image();
  arrowImage.src = 'img/arrow.png';
  arrowImage.onload = handleLoad;
  this.arrowImage = arrowImage;

  var commandImage = new Image();
  commandImage.src = 'img/command.png';
  commandImage.onload = handleLoad;
  this.commandImage = commandImage;
};

Renderer.prototype.reset = function() {
  this.cacheMap = new TileMap(this.interpreter.map.width,
    this.interpreter.map.height);
  this.canvases.setSize(this.width * this.interpreter.map.width,
    this.width * this.interpreter.map.height);
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
  for (var y = 0; y < this.interpreter.map.height; ++y) {
    for (var x = 0; x < this.interpreter.map.width; ++x) {
      this.cacheMap.set(x, y, {});
      this.updateTile(x, y);
    }
  }
};

Renderer.prototype.redraw = function() {
  // Redraw all tiles
  for (var y = 0; y < this.interpreter.map.height; ++y) {
    for (var x = 0; x < this.interpreter.map.width; ++x) {
      this.updateTile(x, y);
    }
  }
};

Renderer.prototype.updateTile = function(x, y) {
  var state = this.interpreter.state;
  var tile = this.interpreter.map.get(x, y);
  var cacheTile = this.cacheMap.get(x, y);
  if (tile) {
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

    if (cacheTile.text != tile.original) {
      cacheTile.text = tile.original;
      var textCtx = this.canvases.get('text');
      textCtx.clearRect(0, 0, this.width, this.width);
      textCtx.fillText(tile.original, this.width / 2, this.width / 2);
    }

    // TODO should not use hard coding for image sizes

    if (tile.directions && (cacheTile.directions != Object.keys(tile.directions).length)) {
      cacheTile.directions = Object.keys(tile.directions).length;
      this.canvases.get('path').clearRect(0, 0, this.width, this.width);
      for (var key in tile.directions) {
        var segment = segmentMap[tile.directions[key].segment % 4];
        var pathPos = pathMap[key];
        // globalAlpha is evil for Firefox
        var pathImg = this.pathImage;
        if (tile.directions[key].unlikely) pathImg = this.pathTransparentImage;
        this.canvases.get('path').drawImage(pathImg, (segment[0] * 4 + pathPos[0]) * 100, (segment[1] * 3 + pathPos[1]) * 100,
          100, 100, 0, 0, this.width, this.width);
      }
    }

    if (cacheTile.direction != tile.direction) {
      cacheTile.direction = tile.direction;
      var arrowCtx = this.canvases.get('arrow');
      arrowCtx.clearRect(0, 0, this.width, this.width);
      var arrowPos = arrowMap[tile.direction];
      arrowCtx.drawImage(this.arrowImage,
        arrowPos[0] * 100, arrowPos[1] * 100,
        100, 100, 0, 0, this.width, this.width);
    }

    if (cacheTile.command != tile.command || cacheTile.data != tile.data) {
      cacheTile.command = tile.command;
      cacheTile.data = tile.data;
      var commandCtx = this.canvases.get('command');
      var commandPos = commandMap[tile.command];
      commandCtx.clearRect(0, 0, this.width, this.width);
      commandCtx.drawImage(this.commandImage,
        commandPos[0] * 100, commandPos[1] * 100,
        100, 100, 0, 0, this.width, this.width);
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

    this.canvases.forEach(function(ctx) {
      ctx.restore();
    }, this);
  }
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

},{"./canvaslayer":1,"./hangul":4,"./tilemap":16}],14:[function(require,module,exports){
function ScrollPane(viewport, clickCallback) {
  this.viewport = viewport;
  this.clickCallback = clickCallback;
  this.registerEvents();
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
    if (Math.abs(moveX) < 6 && Math.abs(moveY) < 6 && self.clickCallback) {
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

},{}],15:[function(require,module,exports){
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

},{"./tilemap":16}],16:[function(require,module,exports){
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

module.exports = TileMap;
},{}],17:[function(require,module,exports){
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
  this.keyboard = new Keyboard(this);
  this.generateTable();
}

ToolBox.prototype.generateTable = function() {
  var self = this;
  // TODO no hardcoding
  var tilemap = new TileMap(11, 3);
  for(var y = 0; y < tilemap.height; ++y) {
    for(var x = 0; x < tilemap.width; ++x) {
      var key = Keyboard.KeyShiftLayout[y][x];
      tilemap.set(x, y, {
        value: Keyboard.KeyMapping[key],
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
      // TODO Not sure if it's good idea to abuse closures
      // Though I don't think this is abusing.
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

},{"./keyboard":7,"./table":15,"./tilemap":16}],18:[function(require,module,exports){
var ScrollPane = require('./scrollpane');
var parser = require('./parser');

function Viewport(element, toolbox, renderer, contextmenu,
  checkCallback, clickCallback) {
  this.element = element;
  this.toolbox = toolbox;
  this.renderer = renderer;
  this.contextmenu = contextmenu;
  this.scrollpane = new ScrollPane(element, this.handleMouseClick.bind(this));
  this.checkCallback = checkCallback;
  this.clickCallback = clickCallback;
  this.hookEvents();
}

Viewport.prototype.hookEvents = function() {
  this.element.addEventListener('contextmenu', this.handleContext.bind(this));
}

Viewport.prototype.handleMouseClick = function(e) {
  // TODO it could be better.
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
    if (selected.type == 'arrow') tile.direction = selected.name;
    else tile.command = selected.name;
    tile.original = parser.encodeSyllable(tile);
    this.renderer.map.set(tileX, tileY, tile);
    this.renderer.updateTile(tileX, tileY);
    this.clickCallback(tileX, tileY, tile);
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

},{"./parser":10,"./scrollpane":14}]},{},[5]);

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
  viewport.style.width = width+'px';
  viewport.style.height = height+'px';
  while(viewport.firstChild) viewport.removeChild(viewport.firstChild);
  for(var i = 0; i < layerNames.length; ++i) {
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
  this.viewport.style.width = this.width+'px';
  this.viewport.style.height = this.height+'px';
  for(var i = 0; i < this.layers.length; ++i) {
    var layer = this.layers[i];
    layer.width = width;
    layer.height = height;
  }
}

CanvasLayer.prototype.get = function(layerName) {
  return this.layerContextsByName[layerName];
}

CanvasLayer.prototype.getCanvas = function(layerName) {
  return this.layersByName[layerName];
}

CanvasLayer.prototype.forEach = function(callback, thisObj) {
  this.layerContexts.forEach(callback, thisObj);
}

CanvasLayer.prototype.canvasForEach = function(callback, thisObj) {
  this.layers.forEach(callback, thisObj);
}

CanvasLayer.prototype.dump = function(targetCanvas) {
  var ctx = targetCanvas.getContext('2d');
  targetCanvas.width = this.width;
  targetCanvas.height = this.height;
  this.canvasForEach(function(canvas) {
    ctx.drawImage(canvas, 0, 0);
  });
}

module.exports = CanvasLayer;

},{}],2:[function(require,module,exports){
var Hangul = {
  initial: 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'.split(''),
  medial: 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'.split(''),
  final: ' ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'.split(''),
  code: 0xAC00
};

module.exports = Hangul;

},{}],3:[function(require,module,exports){
// Entry point of the application

var parser = require('./parser');
var Renderer = require('./renderer');
var Interpreter = require('./interpreter');
var Predictor = require('./predictor');
var Hangul = require('./hangul');

var interpreter;
var renderer;
var predictor;

window.onload = function() {
  document.getElementById('codeForm').onsubmit = function() {
    var code = document.getElementById('codeForm-code').value;
    interpreter = new Interpreter(code);
    var predictQuota = interpreter.map.width * interpreter.map.height * 2;
    predictor = new Predictor(interpreter.map);
    for(var i = 0; i < predictQuota; ++i) {
      if(!predictor.next()) break;
    }
    predictor.updated = [];
    renderer = new Renderer(document.getElementById('viewport'), interpreter);
    window.interpreter = interpreter;
    window.predictor = predictor;
    document.getElementById('codeForm-output').value = '';
    // TODO implement input
    return false;
  }
  setInterval(function() {
    if(!interpreter || !renderer) return;
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
    document.getElementById('codeForm-debug').value = (function() {
      var str = '';
      var state = interpreter.state;
      if(state.running) {
        var direction = state.direction;
        str += '실행 중 (위치 '+state.x+', '+state.y+') ';
        str += '(방향 '+direction.x+', '+direction.y+')\n';
      } else {
        str += '실행 끝\n';
      }
      for(var i = 0; i < 28; ++i) {
        if(state.selected == i) {
          str += '>> ';
        }
        str += Hangul.final[i]+': ';
        str += state.memory[i].data.join(' ');
        str += '\n';
      }
      return str;
    })();
  }, 20);
  document.getElementById('captureBtn').onclick = function() {
    renderer.canvases.dump(document.getElementById('capture'));
  }
}

},{"./hangul":2,"./interpreter":4,"./parser":6,"./predictor":7,"./renderer":8}],4:[function(require,module,exports){
var parser = require('./parser');
var memory = require('./memory');

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
      if(data == 0) return true;
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

var UP = 1;
var DOWN = 2;
var LEFT = 4;
var RIGHT = 8;

var DirectionBitMap = {
  'up': UP,
  'down': DOWN,
  'left': LEFT,
  'right': RIGHT,
  'horizontal': LEFT|RIGHT,
  'vertical': UP|DOWN,
  'up-left': UP|LEFT,
  'down-left': DOWN|LEFT,
  'up-right': UP|RIGHT,
  'down-right': DOWN|RIGHT
};

var DirectionBitRevMap = {};
Object.keys(DirectionBitMap).forEach(function(k) {
  DirectionBitRevMap[DirectionBitMap[k]] = k;
});

function Interpreter(code) {
  if(typeof code == 'string') {
    this.map = parser.parse(code);
  } else {
    this.map = code;
  }
  this.reset();
}

Interpreter.prototype.push = function(data) {
  
}

Interpreter.prototype.shift = function() {
  // Return the string and empties it
  var output = this.state.output.join('');
  this.state.output = [];
  return output;
}

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
  }
  this.updated = [];
  // Initialize memory
  for(var i = 0; i < 28; ++i) {
    switch(i) {
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
}

Interpreter.prototype.next = function() {
  if(!this.state.running) return false;
  var direction = this.state.direction;
  direction.x = sign(direction.x);
  direction.y = sign(direction.y);
  var preDir = convertDir(-direction.x, -direction.y);
  var tile = this.map.get(this.state.x, this.state.y);
  if(tile != null) {
    // Set the direction
    var tileDir = DirectionMap[tile.direction];
    direction.x = calculateDir(direction.x, tileDir.x);
    direction.y = calculateDir(direction.y, tileDir.y);
    // Execute the command
    var selected = this.state.selected;
    var memory = this.state.memory[selected];
    var error = false;
    var command = CommandMap[tile.command];
    if(command) {
      if(memory.canPull(command.data)) {
        error = !!command.exec(tile, this.state, memory);
      } else {
        error = true;
      }
    }
  }
  // Just stop
  if(!this.state.running) return false;
  if(error) {
    direction.x *= -1;
    direction.y *= -1;
  }
  // Add 'skip' direction to skipping tile
  if(Math.abs(direction.x) >= 2 || Math.abs(direction.y) >= 2) {
    var skipX = movePos(this.state.x, sign(direction.x), this.map.width);
    var skipY = movePos(this.state.y, sign(direction.y), this.map.height);
    var skipTile = this.map.get(skipX, skipY);
    this.updated.push({
      x: skipX,
      y: skipY
    });
    if(direction.x) {
      writeDir(skipTile, 'skip-horizontal');
    } else {
      writeDir(skipTile, 'skip-vertical');
    }
  }
  // Move to tile
  this.updated.push({
    x: this.state.x,
    y: this.state.y
  });
  var bitDir = preDir | convertDir(direction.x, direction.y);
  writeDir(tile, DirectionBitRevMap[bitDir]);
  this.state.x = movePos(this.state.x, direction.x, this.map.width);
  this.state.y = movePos(this.state.y, direction.y, this.map.height);
  return this.state.running;
}

function calculateDir(current, target) {
  if(target == 1000) return current;
  else if(target == -1000) return -current;
  return target;
}

function convertDir(x, y) {
  var val = 0;
  if(y <= -1) val |= UP;
  if(y >= 1) val |= DOWN;
  if(x <= -1) val |= LEFT;
  if(x >= 1) val |= RIGHT;
  return val;
}

function movePos(pos, dir, size) {
  pos += dir;
  if(pos < 0) pos = size + pos;
  if(pos >= size) pos = pos - size;
  return pos;
}

function sign(a) {
  if(a>0) return 1;
  else if(a<0) return -1;
  else return 0;
}

function writeDir(tile, direction) {
  if(tile == null) return;
  if(tile.directions == null) {
    tile.directions = {};
  }
  if(tile.directions[direction] == null) {
    tile.directions[direction] = {
      segment: 0
    };
  }
  //tile.directions[direction] ++;
}

module.exports = Interpreter;

},{"./memory":5,"./parser":6}],5:[function(require,module,exports){
function Memory() {
}

Memory.prototype.push = function(data) {
}

Memory.prototype.pull = function() {
}

Memory.prototype.canPull = function(quantity) {
}

Memory.prototype.copy = function() {
}

Memory.prototype.flip = function() {
}

function Stack() {
  this.data = [];
}

Stack.prototype.push = function(data) {
  this.data.push(data);
}

Stack.prototype.pull = function() {
  return this.data.pop();
}

Stack.prototype.canPull = function(quantity) {
  return this.data.length >= quantity;
}

Stack.prototype.copy = function() {
  if(!this.canPull(1)) return false;
  var data = this.pull();
  this.data.push(data);
  this.data.push(data);
  return true;
}

Stack.prototype.flip = function() {
  if(!this.canPull(2)) return false;
  var a = this.pull();
  var b = this.pull();
  this.data.push(a);
  this.data.push(b);
  return true;
}

function Queue() {
  this.data = [];
}

Queue.prototype.push = function(data) {
  this.data.push(data);
}

Queue.prototype.pull = function() {
  return this.data.shift();
}

Queue.prototype.canPull = function(quantity) {
  return this.data.length >= quantity;
}

Queue.prototype.copy = function() {
  if(!this.canPull(1)) return false;
  var data = this.data[0];
  this.data.unshift(data);
  return true;
}

Queue.prototype.flip = function() {
  if(!this.canPull(2)) return false;
  var a = this.pull();
  var b = this.pull();
  this.data.unshift(b);
  this.data.unshift(a);
  return true;
}

module.exports.Memory = Memory;
module.exports.Stack = Stack;
module.exports.Queue = Queue;

},{}],6:[function(require,module,exports){
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
}

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
  if(!isHangul(code)) return data;
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
  if(data.command == 'push') {
    if(final == 'ㅇ') data.command = 'push-number';
    else if(final == 'ㅎ') data.command = 'push-unicode';
    else data.data = LineMap[final];
  }
  if(data.command == 'pop') {
    if(final == 'ㅇ') data.command = 'pop-number';
    else if(final == 'ㅎ') data.command = 'pop-unicode';
  }
  if(data.command == 'select' || data.command == 'move') {
    data.data = finalCode;
  }
  return data;
}

function encodeSyllable(data) {
  var initial = CommandReverseMap[data.command];
  var medial = DirectionReverseMap[data.direction];
  var final = ' ';
  // TODO randomize outputs
  if(data.command == 'push-number') {
    initial = 'ㅂ';
    final = 'ㅇ'; 
  } else if(data.command == 'push-unicode') {
    initial = 'ㅂ';
    final = 'ㅎ'; 
  } else if(data.command == 'push') {
    final = LineReverseMap[data.data];
  } else if(data.command == 'pop-number') {
    initial = 'ㅁ';
    final = 'ㅇ'; 
  } else if(data.command == 'pop-unicode') {
    initial = 'ㅁ';
    final = 'ㅎ'; 
  } else if(data.command == 'select' || data.command == 'move') {
    final = Hangul.final[data.data];
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

function parse(data) {
  var lines = data.split('\n');
  var map = new TileMap(0, lines.length);
  for(var y = 0; y < lines.length; ++y) {
    var line = lines[y].split('');
    map.expand(line.length, 0);
    for(var x = 0; x < line.length; ++x) {
      map.set(x, y, parseSyllable(line[x]));
    }
  }
  return map;
}

module.exports.parseSyllable = parseSyllable;
module.exports.parse = parse;
module.exports.encodeSyllable = encodeSyllable;

},{"./hangul":2,"./tilemap":9}],7:[function(require,module,exports){
var parser = require('./parser');
// Predicts the path of the code
// TODO this requires some serious refactoring... really.


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
  'horizontal': LEFT|RIGHT,
  'vertical': UP|DOWN,
  'up-left': UP|LEFT,
  'down-left': DOWN|LEFT,
  'up-right': UP|RIGHT,
  'down-right': DOWN|RIGHT
};

var DirectionBitRevMap = {};
Object.keys(DirectionBitMap).forEach(function(k) {
  DirectionBitRevMap[DirectionBitMap[k]] = k;
});

var ReversibleMap = {
  'condition': true,
  'pop': true,
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
  if(typeof code == 'string') {
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
  if(this.stack.length == 0) return false;
  var state = this.stack[this.stack.length-1];
  if(state.register) {
    // Assign segment
    state.segment = this.segmentId++;
    this.segments[state.segment] = [];
    // Update the tile
    if(state.register.preDir) {
      processDir({
          x: state.register.x,
          y: state.register.y
        }, this.map, state.direction, state.register.preDir,
        this.updated, state.segment, state.unlikely);
    }
    delete state.register;
  }
  var segment = this.segments[state.segment];
  var direction = state.direction;
  direction.x = sign(direction.x);
  direction.y = sign(direction.y);
  var preDir = convertDir(-direction.x, -direction.y);
  var tile = this.map.get(state.x, state.y);
  var removal = false;
  if(segment) segment.push(tile);
  if(tile != null) {
    if(!tile.segments) {
      tile.segments = {};
    }
    // Set the direction
    var tileDir = DirectionMap[tile.direction];
    direction.x = calculateDir(direction.x, tileDir.x);
    direction.y = calculateDir(direction.y, tileDir.y);
    if(tile.command == 'end') removal = true;
    if(tile.segments[convertDir(direction.x, direction.y)]) {
      removal = true;
    } else {
      tile.segments[convertDir(direction.x, direction.y)] = {
        segment: state.segment,
        position: segment? segment.length - 1 : 0
      }
    }
    if(ReversibleMap[tile.command]) {
      var flipDir = {
        x: -direction.x,
        y: -direction.y
      };
      var flipState = {
        x: movePos(state.x, flipDir.x, this.map.width),
        y: movePos(state.y, flipDir.y, this.map.height),
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
      if(flipTile) {
        var flipTileDir = DirectionMap[flipTile.direction];
        if(flipTileDir.x == direction.x && flipTileDir.y == direction.y) {
          // It's useless; skipping
          skip = true;
        }
      }
      if(!skip && (!flipTile || !flipTile.segments || 
        !flipTile.segments[convertDir(flipDir.x, flipDir.y)])) {
        if(UnlikelyMap[tile.command]) {
          flipState.unlikely = true;
          this.stack.unshift(flipState);
        } else {
          this.stack.push(flipState);
        }
      }
    }
  }
  processDir(state, this.map, direction, preDir, this.updated, state.segment,
    state.unlikely);
  state.x = movePos(state.x, direction.x, this.map.width);
  state.y = movePos(state.y, direction.y, this.map.height);
  if(removal) {
    this.stack.splice(this.stack.indexOf(state), 1);
    if(segment && segment.length <= 1) {
      delete this.segments[state.segment];
    }
  }
  return this.stack.length > 0;
}

function processDir(state, map, direction, preDir, updated, segment, unlikely) {
  var tile = map.get(state.x, state.y);
  // Add 'skip' direction to skipping tile
  if(isSkipping(direction.x, direction.y)) {
    var skipX = movePos(state.x, sign(direction.x), map.width);
    var skipY = movePos(state.y, sign(direction.y), map.height);
    var skipTile = map.get(skipX, skipY);
    updated.push({
      x: skipX,
      y: skipY
    });
    if(direction.x) {
      writeDir(skipTile, 'skip-horizontal', segment, unlikely);
    } else {
      writeDir(skipTile, 'skip-vertical', segment, unlikely);
    }
  }
  // Move to tile
  updated.push({
    x: state.x,
    y: state.y
  });
  var bitDir = preDir | convertDir(direction.x, direction.y);
  writeDir(tile, DirectionBitRevMap[bitDir], segment, unlikely);
}

function calculateDir(current, target) {
  if(target == 1000) return current;
  else if(target == -1000) return -current;
  return target;
}

function isSkipping(x, y) {
  return Math.abs(x) >= 2 || Math.abs(y) >= 2;
}

function convertDir(x, y) {
  var val = 0;
  if(y <= -1) val |= UP;
  if(y >= 1) val |= DOWN;
  if(x <= -1) val |= LEFT;
  if(x >= 1) val |= RIGHT;
  return val;
}

function movePos(pos, dir, size) {
  pos += dir;
  if(pos < 0) pos = size + pos;
  if(pos >= size) pos = pos - size;
  return pos;
}

function sign(a) {
  if(a>0) return 1;
  else if(a<0) return -1;
  else return 0;
}

function writeDir(tile, direction, segment, unlikely) {
  if(tile == null) return;
  if(tile.directions == null) {
    tile.directions = {};
  }
  if(tile.directions[direction] == null) {
    tile.directions[direction] = {
      segment: segment,
      unlikely: unlikely
    };
  }
}


module.exports = Predictor;

},{"./parser":6}],8:[function(require,module,exports){
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
  if (typeof stroke == "undefined" ) {
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
  this.width = width || 48;
  
  this.canvases = new CanvasLayer(viewport,
    ['background', 'highlight', 'text', 'path', 'arrow', 'command'],
    this.width * interpreter.map.width, this.width * interpreter.map.height);
  
  // TODO hold sprite sheets somewhere else and refactor code
  var loadCount = 3;
  var self = this;
  function handleLoad() {
    loadCount --;
    if(loadCount == 0) self.reset();
  }
  
  var pathImage = new Image();
  pathImage.src = 'img/path.svg';
  pathImage.onload = handleLoad;
  this.pathImage = pathImage;
  
  var arrowImage = new Image();
  arrowImage.src = 'img/arrow.svg';
  arrowImage.onload = handleLoad;
  this.arrowImage = arrowImage;
  
  var commandImage = new Image();
  commandImage.src = 'img/command.svg';
  commandImage.onload = handleLoad;
  this.commandImage = commandImage;
}

Renderer.prototype.reset = function() {
  this.cacheMap = new TileMap(this.interpreter.map.width,
    this.interpreter.map.height);
  this.canvases.setSize(this.width * this.interpreter.map.width, 
    this.width * this.interpreter.map.height);
  this.canvases.forEach(function(ctx) {
    ctx.font = (this.width*0.6)+"px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#000";
  }, this);
  this.canvases.get('background').fillRect(0, 0, 
    this.canvases.width, this.canvases.height);
  this.canvases.get('text').fillStyle = "#555";
  // Redraw all tiles
  for(var y = 0; y < this.interpreter.map.height; ++y) {
    for(var x = 0; x < this.interpreter.map.width; ++x) {
      this.cacheMap.set(x, y, {});
      this.updateTile(x, y);
    }
  }
}

Renderer.prototype.updateTile = function(x, y) {
  var state = this.interpreter.state;
  var tile = this.interpreter.map.get(x, y);
  var cacheTile = this.cacheMap.get(x, y);
  if(tile) {
    this.canvases.forEach(function(ctx) {
      ctx.save();
      ctx.translate(x * this.width, y * this.width);
    }, this);
    
    var highlightCtx = this.canvases.get('highlight');
    highlightCtx.clearRect(0, 0, this.width, this.width);
    if(state && state.x == x && state.y == y) {
      highlightCtx.fillStyle = "#666";
    } else if(tile.called) {
      highlightCtx.fillStyle = "#333";
    } else {
      highlightCtx.fillStyle = "#222";
    }
    roundRect(highlightCtx, 1, 1, this.width-2, this.width-2, 4, true);
    
    if(cacheTile.text != tile.original) {
      cacheTile.text = tile.original;
      var textCtx = this.canvases.get('text');
      textCtx.clearRect(0, 0, this.width, this.width);
      textCtx.fillText(tile.original, this.width/2, this.width/2);
    }
    
    // TODO should not use hard coding for image sizes
    
    if(tile.directions && cacheTile.directions != Object.keys(tile.directions).length) {
      cacheTile.directions = Object.keys(tile.directions).length;
      this.canvases.get('path').clearRect(0, 0, this.width, this.width);
      for(var key in tile.directions) {
        var segment = segmentMap[tile.directions[key].segment%4];
        var pathPos = pathMap[key];
        this.canvases.get('path').globalAlpha = tile.directions[key].unlikely ?
          0.2 : 1;
        this.canvases.get('path').drawImage(this.pathImage,
          (segment[0]*4+pathPos[0]) * 100, (segment[1]*3+pathPos[1]) * 100,
          100, 100, 0, 0, this.width, this.width);
      }
    }
    
    if(cacheTile.direction != tile.direction) {
      cacheTile.direction = tile.direction;
      var arrowCtx = this.canvases.get('arrow');
      arrowCtx.clearRect(0, 0, this.width, this.width);
      var arrowPos = arrowMap[tile.direction];
      arrowCtx.drawImage(this.arrowImage,
        arrowPos[0] * 100, arrowPos[1] * 100,
        100, 100, 0, 0, this.width, this.width);
    }
    
    if(cacheTile.command != tile.command) {
      cacheTile.command = tile.command;
      var commandCtx = this.canvases.get('command');
      var commandPos = commandMap[tile.command];
      commandCtx.drawImage(this.commandImage,
        commandPos[0] * 100, commandPos[1] * 100,
        100, 100, 0, 0, this.width, this.width);
      if(tile.data != null) {
        var text = tile.data;
        if(tile.command != 'push') text = Hangul.final[tile.data];
        commandCtx.font = (this.width*0.3)+"px sans-serif";
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
}

Renderer.prototype.preNext = function() {
}

Renderer.prototype.postNext = function() {
  var state = this.interpreter.state;
  while(this.interpreter.updated.length > 0) {
    var pos = this.interpreter.updated.shift();
    this.updateTile(pos.x, pos.y);
  }
  if(state) this.updateTile(state.x, state.y);
}

module.exports = Renderer;

},{"./canvaslayer":1,"./hangul":2,"./tilemap":9}],9:[function(require,module,exports){
function TileMap(width, height) {
  this.width = width;
  this.height = height;
  this.map = null;
  this.clear();
}

TileMap.prototype.clear = function() {
  this.map = [];
  for(var y = 0; y < this.height; ++y) {
    var row = [];
    for(var x = 0; x < this.width; ++x) {
      row[x] = null;
    }
    this.map[y] = row;
  }
}

TileMap.prototype.expand = function(width, height) {
  var prevWidth = this.width;
  var prevHeight = this.height;
  if(width > this.width) this.width = width;
  if(height > this.height) this.height = height;
  for(var y = 0; y < prevHeight; ++y) {
    var row = this.map[y];
    for(var x = prevWidth; x < this.width; ++x) {
      row[x] = null;
    }
  }
  for(var y = prevHeight; y < this.height; ++y) {
    var row = [];
    for(var x = 0; x < this.width; ++x) {
      row[x] = null;
    }
    this.map[y] = row;
  }
}

TileMap.prototype.get = function(x, y) {
  if(y < 0 || y >= this.height) return null;
  if(x < 0 || x >= this.width) return null;
  return this.map[y][x];
}

TileMap.prototype.set = function(x, y, data) {
  if(y < 0 || y >= this.height) throw new Error('TileMap out of bounds');
  if(x < 0 || x >= this.width) throw new Error('TileMap out of bounds');
  this.map[y][x] = data;
}

module.exports = TileMap;

},{}]},{},[3]);

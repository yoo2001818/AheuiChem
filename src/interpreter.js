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
    // TODO move memory pull checks to somewhere else
    switch(tile.command) {
      case 'end':
        move = 0;
        this.state.running = false;
      break;
      case 'add':
      case 'multiply':
      case 'subtract':
      case 'divide':
      case 'mod':
        if(!memory.canPull(2)) {
          error = true;
          break;
        }
        var a = memory.pull();
        var b = memory.pull();
        if(tile.command == 'add') memory.push(b + a);
        if(tile.command == 'multiply') memory.push(b * a);
        if(tile.command == 'subtract') memory.push(b - a);
        if(tile.command == 'divide') memory.push(b / a | 0);
        if(tile.command == 'mod') memory.push(b % a);
      break;
      case 'pop':
        error = memory.pull() == null;
      break;
      case 'push':
        memory.push(tile.data);
      break;
      case 'push-unicode':
        // TODO
        memory.push(0xAC00);
      break;
      case 'push-number':
        // TODO
        memory.push(123);
      break;
      case 'pop-unicode':
        if(!memory.canPull(1)) {
          error = true;
          break;
        }
        var data = memory.pull();
        this.state.output.push(String.fromCharCode(data));
      break;
      case 'pop-number':
        if(!memory.canPull(1)) {
          error = true;
          break;
        }
        var data = memory.pull();
        this.state.output = this.state.output.concat(String(data).split(''));
      break;
      case 'copy':
        if(!memory.canPull(1)) {
          error = true;
          break;
        }
        memory.copy();
      break;
      case 'flip':
        if(!memory.canPull(2)) {
          error = true;
          break;
        }
        memory.flip();
      break;
      case 'select':
        this.state.selected = tile.data;
      break;
      case 'move':
        var target = this.state.memory[tile.data];
        if(!memory.canPull(1)) {
          error = true;
          break;
        }
        var data = memory.pull();
        target.push(data);
      break;
      case 'compare':
        if(!memory.canPull(2)) {
          error = true;
          break;
        }
        var a = memory.pull();
        var b = memory.pull();
        memory.push(b >= a ? 1 : 0);
      break;
      case 'condition':
        if(!memory.canPull(1)) {
          error = true;
          break;
        }
        var data = memory.pull();
        if(data == 0) error = true;
      break;
    }
  }
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

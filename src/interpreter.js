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

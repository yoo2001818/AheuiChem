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
  if(newTile) this.state.breakpoint = newTile.breakpoint;
  return this.state.running;
};

// TODO move it somewhere?
// Trims the tilemap
Interpreter.prototype.trim = function(checkUsed) {
  var requestedWidth = 0;
  var requestedHeight = 0;
  for(var y = 0; y < this.map.height; ++y) {
    var currentWidth = 0;
    for(var x = 0; x < this.map.getWidth(y); ++x) {
      var tile = this.map.get(x, y);
      if(tile == null) continue;
      if(tile.direction == 'none' && tile.command == 'none') continue;
      // ... why is it here..
      if(checkUsed && tile.directions == null) continue;
      if(checkUsed && tile.directions.length == 0) continue;
      currentWidth = x + 1;
    }
    this.map.map[y] = this.map.map[y].slice(0, currentWidth);
    /* for(var x = currentWidth; x < this.map.width; ++x) {
      this.map.set(x, y, null);
    } */
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

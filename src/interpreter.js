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
  var preDir = Direction.convertToBits(-direction.x, -direction.y);
  var tile = this.map.get(this.state.x, this.state.y);
  if(tile != null) {
    // Set the direction
    var tileDir = Direction.map[tile.direction];
    direction.x = Direction.calculate(direction.x, tileDir.x);
    direction.y = Direction.calculate(direction.y, tileDir.y);
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
  Direction.process(this.state, this.map, direction, preDir, this.updated, 
    0);
  return this.state.running;
}

module.exports = Interpreter;

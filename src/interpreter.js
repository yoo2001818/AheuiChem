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
    exec: function(tile, state, memory) {
      state.selected = tile.data;
    }
  },
  'move': {
    data: 1,
    output: 0, // This also requires some special handling
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

var CommandMapKeys = Object.keys(CommandMap);

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

// Accepts bytecode now
function Interpreter(code, debug) {
  this.code = code;
  this.debug = debug;
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
    position: 0,
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

Interpreter.prototype.read = function() {
  return this.code[this.state.position++];
}

Interpreter.prototype.next = function() {
  if (!this.state.running) return false;
  // Read command
  var state = this.state;
  var command = this.read();
  var memory = this.state.memory[this.state.selected];
  this.updated.push({
    x: this.state.x,
    y: this.state.y
  });
  var dbg = this.debug[this.state.position-1];
  this.state.x = dbg.x;
  this.state.y = dbg.y;
  switch(command) {
    case 0: // end
      this.state.running = false;
      break;
    case 1: // add
    case 2: // multiply
    case 3: // subtract
    case 4: // divide
    case 5: // mod
      var a = memory.pull();
      var b = memory.pull();
      if(command == 1) memory.push(b + a);
      if(command == 2) memory.push(b * a);
      if(command == 3) memory.push(b - a);
      if(command == 4) memory.push(b / a | 0);
      if(command == 5) memory.push(b % a);
      break;
    case 6: // pop
      memory.pull();
      break;
    case 7: // pop-unicode
      var data = memory.pull();
      state.output.push(String.fromCharCode(data));
      break;
    case 8: // pop-number
      var data = memory.pull();
      state.output = state.output.concat(String(data).split(''));
      break;
    case 9: // push
      memory.push(this.read());
      break;
    case 10: // push-unicode
      var val = state.input.shift();
      if(val == null) memory.push(-1);
      else memory.push(val.charCodeAt(0));
      break;
    case 11: // push-number
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
      break;
    case 12: // copy
      memory.copy();
      break;
    case 13: // flip
      memory.flip();
      break;
    case 14: // select
      state.selected = this.read();
      break;
    case 15: // move
      var target = state.memory[this.read()];
      var data = memory.pull();
      target.push(data);
      break;
    case 16: // compare
      var a = memory.pull();
      var b = memory.pull();
      memory.push(b >= a ? 1 : 0);
      break;
    case 17: // condition
      var jump = this.read();
      var data = memory.pull();
      if (data == 0) state.position = jump;
      break;
    case 18: // brpop1
      var jump = this.read();
      if(!memory.canPull(1)) state.position = jump;
      break;
    case 19: // brpop2
      var jump = this.read();
      if(!memory.canPull(2)) state.position = jump;
      break;
    case 20: // jmp
      var jump = this.read();
      state.position = jump;
      break;
  }
  if(this.state.position == this.code.length) this.state.running = false;
  return this.state.running;
};

Interpreter.CommandMap = CommandMap;

module.exports = Interpreter;

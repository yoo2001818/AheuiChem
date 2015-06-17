var parser = require('./parser');

var Direction = {
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
  }
};

var DirectionFlip = {
  'up': 'down',
  'left': 'right',
  'right': 'left',
  'down': 'up'
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
    direction: 'down',
    memory: {},
    stack: 0,
    input: [],
    output: [],
    running: true
  }
  // Initialize memory
  for(var i = 0; i < 28; ++i) {
    this.state.memory[i] = [];
  }
}

Interpreter.prototype.next = function() {
  // TODO: should implement queue
  if(!this.state.running) return false;
  var tile = this.map.get(this.state.x, this.state.y);
  // Sets how much Interpreter will move
  var move = 1;
  if(tile != null) {
    // Set the direction
    switch(tile.direction) {
      case 'up':
      case 'left':
      case 'right':
      case 'down':
        this.state.direction = tile.direction;
      break;
      case 'skip-up':
      case 'skip-left':
      case 'skip-right':
      case 'skip-down':
        move = 2;
        this.state.direction = tile.direction.slice(5);
      break;
      case 'horizontal':
        if(this.state.direction == 'up' || this.state.direction == 'down')
          this.state.direction = DirectionFlip[this.state.direction];
      break;
      case 'vertical':
        if(this.state.direction == 'left' || this.state.direction == 'right')
          this.state.direction = DirectionFlip[this.state.direction];
      break;
      case 'reverse':
        this.state.direction = DirectionFlip[this.state.direction];
      break;
    }
    // Execute the command
    var stackId = this.state.stack;
    var stack = this.state.memory[stackId];
    var pop = function() {
      var data;
      if(stack.length == 0) error = true;
      if(stackId == 21) data = stack.shift();
      else data = stack.pop();
      return data;
    }
    var error = false;
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
        if(stack.length < 2) {
          error = true;
          break;
        }
        var a = pop();
        var b = pop();
        if(error) break;
        if(tile.command == 'add') stack.push(b + a);
        if(tile.command == 'multiply') stack.push(b * a);
        if(tile.command == 'subtract') stack.push(b - a);
        if(tile.command == 'divide') stack.push(b / a | 0);
        if(tile.command == 'mod') stack.push(b % a);
      break;
      case 'pop':
        var data = pop();
        if(error) break;
      break;
      case 'push':
        stack.push(tile.data);
      break;
      case 'push-unicode':
        // TODO
        stack.push(0xAC00);
      break;
      case 'push-number':
        // TODO
        stack.push(123);
      break;
      case 'pop-unicode':
        var data = pop();
        if(error) break;
        this.state.output.push(String.fromCharCode(data));
      break;
      case 'pop-number':
        var data = pop();
        if(error) break;
        this.state.output = this.state.output.concat(String(data).split(''));
      break;
      case 'copy':
        var data = pop();
        if(error) break;
        stack.push(data);
        stack.push(data);
      break;
      case 'flip':
        if(stack.length < 2) {
          error = true;
          break;
        }
        var a = pop();
        var b = pop();
        if(error) break;
        stack.push(a);
        stack.push(b);
      break;
      case 'select':
        this.state.stack = tile.data;
      break;
      case 'move':
        var target = this.state.memory[tile.data];
        var data = pop();
        if(error) break;
        target.push(data);
      break;
      case 'compare':
        if(stack.length < 2) {
          error = true;
          break;
        }
        var a = pop();
        var b = pop();
        if(error) break;
        stack.push(b >= a ? 1 : 0);
      break;
      case 'condition':
        var data = pop();
        if(error) break;
        if(data == 0) error = true;
      break;
    }
  }
  if(error) this.state.direction = DirectionFlip[this.state.direction];
  // Move to tile
  var direction = Direction[this.state.direction];
  this.state.x += direction.x * move;
  this.state.y += direction.y * move;
  // Wrap the map
  if(this.state.x < 0) this.state.x = this.map.width - 1;
  if(this.state.x >= this.map.width) this.state.x = 0;
  if(this.state.y < 0) this.state.y = this.map.height - 1;
  if(this.state.y >= this.map.height) this.state.y = 0;
  return this.state.running;
}

module.exports = Interpreter;

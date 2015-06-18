var parser = require('./parser');
var memory = require('./memory');

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
    selected: 0,
    input: [],
    output: [],
    running: true,
    prevX: 0,
    prevY: 0
  }
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
  // TODO: should implement queue
  if(!this.state.running) return false;
  this.state.prevX = this.state.x;
  this.state.prevY = this.state.y;
  var preDirection = this.state.direction;
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
  writeDirection(tile, preDirection, this.state.direction);
  return this.state.running;
}

function writeDirection(tile, preDirection, direction) {
  if(tile == null) return;
  if(tile.directions == null) {
    tile.directions = {};
  }
  // TODO sanitize code
  var directionCode = [DirectionFlip[preDirection], direction];
  directionCode.sort();
  directionCode = directionCode.join('-');
  if(tile.directions[directionCode] == null) {
    tile.directions[directionCode] = 0;
  }
  tile.directions[directionCode] ++;
}

module.exports = Interpreter;

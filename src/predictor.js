var parser = require('./parser');
// Predicts the path of the code
// TODO this requires some serious refactoring... really.

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

var ReversibleMap = {
  'condition': true
  /*
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
  */
};

function Predictor(code) {
  if(typeof code == 'string') {
    this.map = parser.parse(code);
  } else {
    this.map = code;
  }
  this.segments = [[]];
  this.stack = [{
    segment: 0,
    x: 0,
    y: 0,
    direction: 'down'
  }];
  this.updated = [];
}

Predictor.prototype.next = function() {
  if(this.stack.length == 0) return false;
  var state = this.stack[this.stack.length-1];
  var segment = this.segments[state.segment];
  var preDirection = state.direction;
  var removal = false;
  var tile = this.map.get(state.x, state.y);
  segment.push(tile);
  // Sets how much Interpreter will move
  var move = 1;
  if(tile != null) {
    if(!tile.segments) {
      tile.segments = {};
    }
    // Set the direction
    switch(tile.direction) {
      case 'up':
      case 'left':
      case 'right':
      case 'down':
        state.direction = tile.direction;
      break;
      case 'skip-up':
      case 'skip-left':
      case 'skip-right':
      case 'skip-down':
        move = 2;
        state.direction = tile.direction.slice(5);
      break;
      case 'horizontal':
        if(state.direction == 'up' || state.direction == 'down')
          state.direction = DirectionFlip[state.direction];
      break;
      case 'vertical':
        if(state.direction == 'left' || state.direction == 'right')
          state.direction = DirectionFlip[state.direction];
      break;
      case 'reverse':
        state.direction = DirectionFlip[state.direction];
      break;
    }
    if(ReversibleMap[tile.command]) {
      this.segments.push([]);
      var flipDir = DirectionFlip[state.direction];
      var flipVec = Direction[flipDir];
      // TODO this doesn't wrap the map
      for(var i = 0; i < move; ++i) {
        var tileX = state.x + flipVec.x * i;
        var tileY = state.y + flipVec.y * i;
        this.updated.push({
          x: tileX,
          y: tileY
        });
        if(i == 0) continue;
        var skipTile = this.map.get(tileX, tileY);
        if(flipVec.y == 0) {
          writeDirectionString(skipTile, 'skip-horizontal');
        } else {
          writeDirectionString(skipTile, 'skip-vertical');
        }
      }
      writeDirection(tile, preDirection, flipDir);
      this.stack.push({
        segment: this.segments.length - 1,
        x: state.x + flipVec.x * move,
        y: state.y + flipVec.y * move,
        direction: flipDir,
      });
    }
    if(tile.segments[move+'_'+state.direction]) {
      removal = true;
    } else {
      tile.segments[move+'_'+state.direction] = {
        segment: state.segment,
        position: segment.length - 1
      }
    }
  }
  // Move to tile
  var direction = Direction[state.direction];
  // TODO this doesn't wrap the map
  for(var i = 0; i < move; ++i) {
    var tileX = state.x + direction.x * i;
    var tileY = state.y + direction.y * i;
    this.updated.push({
      x: tileX,
      y: tileY
    });
    if(i == 0) continue;
    var skipTile = this.map.get(tileX, tileY);
    if(direction.y == 0) {
      writeDirectionString(skipTile, 'skip-horizontal');
    } else {
      writeDirectionString(skipTile, 'skip-vertical');
    }
  }
  writeDirection(tile, preDirection, state.direction);
  state.x += direction.x * move;
  state.y += direction.y * move;
  
  // Wrap the map
  if(state.x < 0) state.x = this.map.width - 1;
  if(state.x >= this.map.width) state.x = 0;
  if(state.y < 0) state.y = this.map.height - 1;
  if(state.y >= this.map.height) state.y = 0;
  
  if(removal) {
    this.stack.splice(this.stack.indexOf(state), 1);
  }
}

function writeDirection(tile, preDirection, direction) {
  // TODO sanitize code
  // TODO write segment
  var directionCode = [DirectionFlip[preDirection], direction];
  directionCode.sort();
  directionCode = directionCode.join('-');
  writeDirectionString(tile, directionCode);
}

function writeDirectionString(tile, direction) {
  if(tile == null) return;
  if(tile.directions == null) {
    tile.directions = {};
  }
  if(tile.directions[direction] == null) {
    tile.directions[direction] = 0;
  }
  tile.directions[direction] ++;
}


module.exports = Predictor;

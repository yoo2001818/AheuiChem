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
  'pop': true
  /*'add': true,
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
  'compare': true*/
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
    direction: {
      x: 0,
      y: 1
    }
  }];
  this.updated = [];
}

Predictor.prototype.next = function() {
  if(this.stack.length == 0) return false;
  var state = this.stack[this.stack.length-1];
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
        position: segment.length - 1
      }
    }
    if(ReversibleMap[tile.command]) {
      var flipDir = {
        x: -direction.x,
        y: -direction.y
      };
      var flipState = {
        segment: this.segments.length - 1,
        x: movePos(state.x, flipDir.x, this.map.width),
        y: movePos(state.y, flipDir.y, this.map.height),
        direction: flipDir,
      };
      var flipTile = this.map.get(flipState.x, flipState.y);
      if(!flipTile || !flipTile.segments || !flipTile.segments[convertDir(flipDir.x, flipDir.y)]) {
        this.segments.push([]);
        processDir(state, this.map, flipDir, preDir, this.updated, 
          this.segments.length - 1);
        this.stack.push({
          segment: this.segments.length - 1,
          x: movePos(state.x, flipDir.x, this.map.width),
          y: movePos(state.y, flipDir.y, this.map.height),
          direction: flipDir,
        });
      }
    }
  }
  processDir(state, this.map, direction, preDir, this.updated, state.segment);
  state.x = movePos(state.x, direction.x, this.map.width);
  state.y = movePos(state.y, direction.y, this.map.height);
  if(removal) {
    this.stack.splice(this.stack.indexOf(state), 1);
    if(segment && segment.length <= 1) {
      this.segments.splice(state.segment, 1);
    }
  }
  return this.stack.length > 0;
}

function processDir(state, map, direction, preDir, updated, segment) {
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
      writeDir(skipTile, 'skip-horizontal', segment);
    } else {
      writeDir(skipTile, 'skip-vertical', segment);
    }
  }
  // Move to tile
  updated.push({
    x: state.x,
    y: state.y
  });
  var bitDir = preDir | convertDir(direction.x, direction.y);
  writeDir(tile, DirectionBitRevMap[bitDir], segment);
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

function writeDir(tile, direction, segment) {
  if(tile == null) return;
  if(tile.directions == null) {
    tile.directions = {};
  }
  if(tile.directions[direction] == null) {
    tile.directions[direction] = segment;
  }
}


module.exports = Predictor;

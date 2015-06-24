var parser = require('./parser');
var Direction = require('./direction');
// Predicts the path of the code
// TODO this requires some serious refactoring... really.

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
      Direction.process(state.register, this.map, state.direction, 
        state.register.preDir, this.updated, state.segment, state.unlikely);
    }
    delete state.register;
  }
  var segment = this.segments[state.segment];
  var direction = state.direction;
  var preDir = Direction.convertToBits(-direction.x, -direction.y);
  var tile = this.map.get(state.x, state.y);
  var removal = false;
  if(segment) segment.push(tile);
  if(tile != null) {
    if(!tile.segments) {
      tile.segments = {};
    }
    // Set the direction
    var tileDir = Direction.map[tile.direction];
    direction.x = Direction.calculate(direction.x, tileDir.x);
    direction.y = Direction.calculate(direction.y, tileDir.y);
    if(tile.command == 'end') removal = true;
    if(tile.segments[Direction.convertToBits(direction.x, direction.y)]) {
      removal = true;
    } else {
      tile.segments[Direction.convertToBits(direction.x, direction.y)] = {
        segment: state.segment,
        position: segment? segment.length - 1 : 0
      }
    }
    if(!removal && ReversibleMap[tile.command]) {
      var flipDir = {
        x: -direction.x,
        y: -direction.y
      };
      var flipState = {
        x: Direction.move(state.x, flipDir.x, this.map.width),
        y: Direction.move(state.y, flipDir.y, this.map.height),
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
        var flipTileDir = Direction.map[flipTile.direction];
        if(flipTileDir.x == direction.x && flipTileDir.y == direction.y) {
          // It's useless; skipping
          skip = true;
        }
      }
      if(!skip && (!flipTile || !flipTile.segments || 
        !flipTile.segments[Direction.convertToBits(flipDir.x, flipDir.y)])) {
        if(UnlikelyMap[tile.command]) {
          flipState.unlikely = true;
          this.stack.unshift(flipState);
        } else {
          this.stack.push(flipState);
        }
      }
    }
  }
  Direction.process(state, this.map, direction, preDir, this.updated, 
    state.segment, state.unlikely);
  if(removal) {
    this.stack.splice(this.stack.indexOf(state), 1);
    if(segment && segment.length <= 1) {
      delete this.segments[state.segment];
    }
  }
  return this.stack.length > 0;
}

module.exports = Predictor;

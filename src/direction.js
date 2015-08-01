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
// Added to handle predictor appropriately
var SKIP_UP = 16;
var SKIP_DOWN = 32;
var SKIP_LEFT = 64;
var SKIP_RIGHT = 128;

var DirectionBitMap = {
  'up': UP,
  'down': DOWN,
  'left': LEFT,
  'right': RIGHT,
  'horizontal': LEFT | RIGHT,
  'vertical': UP | DOWN,
  'up-left': UP | LEFT,
  'down-left': DOWN | LEFT,
  'up-right': UP | RIGHT,
  'down-right': DOWN | RIGHT,
  // Added to handle predictor appropriately
  'skip-up': SKIP_UP,
  'skip-down': SKIP_DOWN,
  'skip-left': SKIP_LEFT,
  'skip-right': SKIP_RIGHT
};

var DirectionBitRevMap = {};
Object.keys(DirectionBitMap).forEach(function(k) {
  DirectionBitRevMap[DirectionBitMap[k]] = k;
});

function process(pos, map, direction, preDir, updated, segment) {
  var tile = map.get(pos.x, pos.y);
  // Add 'skip' direction to skipping tile
  if (isSkipping(direction.x, direction.y)) {
    var skipY = move(pos.y, sign(direction.y), map.height);
    var skipX = move(pos.x, sign(direction.x), map.getWidth(skipY));
    var skipTile = map.get(skipX, skipY);
    updated.push({
      x: skipX,
      y: skipY
    });
    if (direction.x) {
      write(skipTile, 'skip-horizontal', segment);
    } else {
      write(skipTile, 'skip-vertical', segment);
    }
  }
  // Move to tile
  updated.push({
    x: pos.x,
    y: pos.y
  });
  var bitDir = preDir | convertToBits(direction.x, direction.y);
  write(tile, DirectionBitRevMap[bitDir], segment);
  pos.y = move(pos.y, direction.y, map.height);
  pos.x = move(pos.x, direction.x, map.getWidth(pos.y));
}

function sign(a) {
  if (a > 0) return 1;
  else if (a < 0) return -1;
  else return 0;
}

function isSkipping(x, y) {
  return Math.abs(x) >= 2 || Math.abs(y) >= 2;
}

function calculate(current, target) {
  if (target == 1000) return current;
  else if (target == -1000) return -current;
  return target;
}

function move(pos, dir, size) {
  // Quick fix to retain y value
  if (dir == 0) return pos;
  pos += dir;
  if (pos < 0) pos = Math.max(0, size + pos);
  if (pos >= size) pos = Math.min(size - 1, pos - size);
  return pos;
}

function convertToBits(x, y, honorSkips) {
  var val = 0;
  if(honorSkips && y == -2) return SKIP_UP;
  if(honorSkips && y == 2) return SKIP_DOWN;
  if(honorSkips && x == -2) return SKIP_LEFT;
  if(honorSkips && x == 2) return SKIP_RIGHT;
  if (y <= -1) val |= UP;
  if (y >= 1) val |= DOWN;
  if (x <= -1) val |= LEFT;
  if (x >= 1) val |= RIGHT;
  return val;
}

function write(tile, direction, segment) {
  // Ignore if it's -1
  if (segment == -1) return;
  if (tile == null) return;
  if (tile.directions == null) {
    tile.directions = [];
  }
  if (tile.directions[segment] == null) {
    tile.directions[segment] = [];
  }
  if (tile.directions[segment].indexOf(direction) == -1) {
    tile.directions[segment].push(direction);
  }
}

module.exports = {
  map: DirectionMap,
  bitMap: DirectionBitMap,
  bitRevMap: DirectionBitRevMap,
  process: process,
  calculate: calculate,
  move: move,
  convertToBits: convertToBits,
  write: write
};

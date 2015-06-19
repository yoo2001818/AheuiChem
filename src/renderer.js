var TileMap = require('./tilemap');
var parser = require('./parser');

// TODO is Array good method to do this?
var arrowMap = {
  up: [2, 0],
  left: [2, 1],
  right: [3, 0],
  down: [3, 1],
  'skip-up': [2, 2],
  'skip-left': [2, 3],
  'skip-right': [3, 2],
  'skip-down': [3, 3],
  none: [0, 0],
  horizontal: [1, 0],
  vertical: [1, 1],
  reverse: [0, 1]
};

// TODO it's really messy, should change it soon.
var pathMap = {
  'up-up': [2, 1],
  'left-left': [1, 2],
  'right-right': [3, 0],
  'down-down': [2, 2],
  'left-up': [1, 1],
  'right-up': [0, 2],
  'down-left': [2, 0],
  'down-right': [0, 0],
  'left-right': [1, 0],
  'down-up': [0, 1],
  'skip-horizontal': [3, 1],
  'skip-vertical': [3, 2]
};

// http://stackoverflow.com/a/3368118/3317669
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof stroke == "undefined" ) {
    stroke = true;
  }
  if (typeof radius === "undefined") {
    radius = 5;
  }
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (stroke) {
    ctx.stroke();
  }
  if (fill) {
    ctx.fill();
  }        
}

var Renderer = function(viewport, interpreter, width) {
  this.viewport = viewport;
  this.ctx = viewport.getContext('2d');
  this.interpreter = interpreter;
  this.width = width || 48;
  
  // TODO hold sprite sheets somewhere else and refactor code
  var loadCount = 2;
  var self = this;
  function handleLoad() {
    loadCount --;
    if(loadCount == 0) self.reset();
  }
  
  var pathImage = new Image();
  pathImage.src = 'img/path.svg';
  pathImage.onload = handleLoad;
  this.pathImage = pathImage;
  
  var arrowImage = new Image();
  arrowImage.src = 'img/arrow.svg';
  arrowImage.onload = handleLoad;
  this.arrowImage = arrowImage;
}

Renderer.prototype.reset = function() {
  this.viewport.width = this.width * this.interpreter.map.width;
  this.viewport.height = this.width * this.interpreter.map.height;
  this.ctx.font = (this.width*0.6)+"px sans-serif";
  this.ctx.textAlign = "center";
  this.ctx.textBaseline = "middle";
  this.ctx.fillStyle = "#000";
  this.ctx.fillRect(0, 0, this.viewport.width, this.viewport.height);
  // Redraw all tiles
  for(var y = 0; y < this.interpreter.map.height; ++y) {
    for(var x = 0; x < this.interpreter.map.width; ++x) {
      this.updateTile(x, y);
    }
  }
}

Renderer.prototype.updateTile = function(x, y) {
  var state = this.interpreter.state;
  var tile = this.interpreter.map.get(x, y);
  if(tile) {
    this.ctx.save();
    this.ctx.translate(x * this.width, y * this.width);
    // clear rect
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 0, this.width, this.width);
    // background
    if(state.x == x && state.y == y) {
      this.ctx.fillStyle = "#666";
    } else if(tile.called) {
      this.ctx.fillStyle = "#333";
    } else {
      this.ctx.fillStyle = "#222";
    }
    roundRect(this.ctx, 1, 1, this.width-2, this.width-2, 4, true);
    // TODO seperate canvases, as text rendering is expensive
    // text
    this.ctx.fillStyle = "#aaa";
    this.ctx.fillText(tile.original, this.width/2, this.width/2);
    // path
    for(var key in tile.directions) {
      var pathPos = pathMap[key];
      this.ctx.drawImage(this.pathImage,
        pathPos[0] * 100, pathPos[1] * 100,
        100, 100, 0, 0, this.width, this.width);
    }
    // arrow
    var arrowPos = arrowMap[tile.direction];
    this.ctx.drawImage(this.arrowImage,
      arrowPos[0] * 100, arrowPos[1] * 100,
      100, 100, 0, 0, this.width, this.width);
    this.ctx.restore();
  }
}

Renderer.prototype.preNext = function() {
}

Renderer.prototype.postNext = function() {
  var state = this.interpreter.state;
  while(state.updated.length > 0) {
    var pos = state.updated.shift();
    this.updateTile(pos.x, pos.y);
  }
  this.updateTile(state.x, state.y);
}

module.exports = Renderer;

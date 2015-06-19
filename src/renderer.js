var TileMap = require('./tilemap');
var CanvasLayer = require('./canvaslayer');
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
  this.interpreter = interpreter;
  this.width = width || 48;
  
  this.canvases = new CanvasLayer(viewport,
    ['background', 'highlight', 'text', 'path', 'arrow'],
    this.width * interpreter.map.width, this.width * interpreter.map.height);
  
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
  this.cacheMap = new TileMap(this.interpreter.map.width,
    this.interpreter.map.height);
  this.canvases.setSize(this.width * this.interpreter.map.width, 
    this.width * this.interpreter.map.height);
  this.canvases.forEach(function(ctx) {
    ctx.font = (this.width*0.6)+"px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#000";
  }, this);
  this.canvases.get('background').fillRect(0, 0, 
    this.canvases.width, this.canvases.height);
  this.canvases.get('text').fillStyle = "#aaa";
  // Redraw all tiles
  for(var y = 0; y < this.interpreter.map.height; ++y) {
    for(var x = 0; x < this.interpreter.map.width; ++x) {
      this.cacheMap.set(x, y, {});
      this.updateTile(x, y);
    }
  }
}

Renderer.prototype.updateTile = function(x, y) {
  var state = this.interpreter.state;
  var tile = this.interpreter.map.get(x, y);
  var cacheTile = this.cacheMap.get(x, y);
  if(tile) {
    this.canvases.forEach(function(ctx) {
      ctx.save();
      ctx.translate(x * this.width, y * this.width);
    }, this);
    
    var highlightCtx = this.canvases.get('highlight');
    highlightCtx.clearRect(0, 0, this.width, this.width);
    if(state.x == x && state.y == y) {
      highlightCtx.fillStyle = "#666";
    } else if(tile.called) {
      highlightCtx.fillStyle = "#333";
    } else {
      highlightCtx.fillStyle = "#222";
    }
    roundRect(highlightCtx, 1, 1, this.width-2, this.width-2, 4, true);
    
    if(cacheTile.text != tile.original) {
      cacheTile.text = tile.original;
      var textCtx = this.canvases.get('text');
      textCtx.clearRect(0, 0, this.width, this.width);
      textCtx.fillText(tile.original, this.width/2, this.width/2);
    }
    
    // TODO should not use hard coding for image sizes
    if(tile.directions && cacheTile.directions != Object.keys(tile.directions).length) {
      cacheTile.directions = Object.keys(tile.directions).length;
      this.canvases.get('path').clearRect(0, 0, this.width, this.width);
      for(var key in tile.directions) {
        var pathPos = pathMap[key];
        this.canvases.get('path').drawImage(this.pathImage,
          pathPos[0] * 100, pathPos[1] * 100,
          100, 100, 0, 0, this.width, this.width);
      }
    }
    
    if(cacheTile.direction != tile.direction) {
      cacheTile.direction = tile.direction;
      this.canvases.get('arrow').clearRect(0, 0, this.width, this.width);
      var arrowPos = arrowMap[tile.direction];
      this.canvases.get('arrow').drawImage(this.arrowImage,
        arrowPos[0] * 100, arrowPos[1] * 100,
        100, 100, 0, 0, this.width, this.width);
    }
    
    this.canvases.forEach(function(ctx) {
      ctx.restore();
    }, this);
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

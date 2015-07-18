var TileMap = require('./tilemap');
var CanvasLayer = require('./canvaslayer');
var Hangul = require('./hangul');
var SpriteLoader = require('./spriteloader');

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

var pathMap = {
  'up': [2, 1],
  'left': [1, 2],
  'right': [3, 0],
  'down': [2, 2],
  'up-left': [1, 1],
  'up-right': [0, 2],
  'down-left': [2, 0],
  'down-right': [0, 0],
  'horizontal': [1, 0],
  'vertical': [0, 1],
  'skip-horizontal': [3, 1],
  'skip-vertical': [3, 2]
};

var segmentMap = [
  [0, 0],
  [1, 0],
  [0, 1],
  [1, 1],
  [0, 2],
  [1, 2]
];

var commandMap = {
  'none': [0, 0],
  'end': [1, 0],
  'add': [2, 0],
  'multiply': [3, 0],
  'subtract': [2, 1],
  'divide': [3, 1],
  'mod': [1, 1],
  'push': [0, 1],
  'push-unicode': [4, 1],
  'push-number': [4, 0],
  'pop': [0, 2],
  'pop-unicode': [4, 3],
  'pop-number': [4, 2],
  'copy': [1, 2],
  'flip': [2, 2],
  'select': [3, 2],
  'move': [0, 3],
  'compare': [1, 3],
  'condition': [2, 3]
};

// http://stackoverflow.com/a/3368118/3317669
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof stroke == "undefined") {
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
  var self = this;

  this.interpreter = interpreter;
  this.map = interpreter.map;
  this.width = width || 50;

  this.canvases = new CanvasLayer(viewport, ['background', 'highlight', 'text', 'path', 'arrow', 'command'],
    this.width * interpreter.map.width, this.width * interpreter.map.height);

  this.sprites = new SpriteLoader(function() {
    self.reset();
  });

  this.sprites.load('path', 'img/path.png');
  this.sprites.load('arrow', 'img/arrow.png');
  this.sprites.load('command', 'img/command.png');
};

Renderer.prototype.reset = function() {
  this.cacheMap = new TileMap(this.interpreter.map.width,
    this.interpreter.map.height);
  this.canvases.setSize(this.width * this.interpreter.map.width,
    this.width * this.interpreter.map.height);
  this.canvases.forEach(function(ctx) {
    ctx.font = (this.width * 0.6) + "px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#000";
  }, this);
  this.canvases.get('background').fillRect(0, 0,
    this.canvases.width, this.canvases.height);
  this.canvases.get('text').fillStyle = "#555";
  // Redraw all tiles
  for (var y = 0; y < this.interpreter.map.height; ++y) {
    for (var x = 0; x < this.interpreter.map.width; ++x) {
      this.cacheMap.set(x, y, {});
      this.updateTile(x, y);
    }
  }
};

Renderer.prototype.redraw = function() {
  // Redraw all tiles
  for (var y = 0; y < this.interpreter.map.height; ++y) {
    for (var x = 0; x < this.interpreter.map.width; ++x) {
      this.updateTile(x, y);
    }
  }
};

Renderer.prototype.updateTile = function(x, y) {
  var state = this.interpreter.state;
  var tile = this.interpreter.map.get(x, y);
  var cacheTile = this.cacheMap.get(x, y);
  if (tile) {
    this.canvases.forEach(function(ctx) {
      ctx.save();
      ctx.translate(x * this.width, y * this.width);
    }, this);

    var highlighted = state && state.x == x && state.y == y;
    if (cacheTile.highlighted != highlighted) {
      cacheTile.highlighted = highlighted;
      var highlightCtx = this.canvases.get('highlight');
      highlightCtx.clearRect(0, 0, this.width, this.width);
      if (highlighted) {
        highlightCtx.fillStyle = "#666";
      } else {
        highlightCtx.fillStyle = "#222";
      }
      roundRect(highlightCtx, 1, 1, this.width - 2, this.width - 2, 4, true);
    }

    if (cacheTile.text != tile.original) {
      cacheTile.text = tile.original;
      var textCtx = this.canvases.get('text');
      textCtx.clearRect(0, 0, this.width, this.width);
      textCtx.fillText(tile.original, this.width / 2, this.width / 2);
    }

    // TODO should not use hard coding for image sizes

    if (tile.directions && (cacheTile.directions != Object.keys(tile.directions).length)) {
      cacheTile.directions = Object.keys(tile.directions).length;
      this.canvases.get('path').clearRect(0, 0, this.width, this.width);
      for (var key in tile.directions) {
        var segment = segmentMap[tile.directions[key] % 6];
        var pathPos = pathMap[key];
        var pathImg = this.sprites.get('path');
        this.canvases.get('path').drawImage(pathImg, (segment[0] * 4 + pathPos[0]) * 100, (segment[1] * 3 + pathPos[1]) * 100,
          100, 100, 0, 0, this.width, this.width);
      }
    }

    if (cacheTile.direction != tile.direction) {
      cacheTile.direction = tile.direction;
      var arrowCtx = this.canvases.get('arrow');
      arrowCtx.clearRect(0, 0, this.width, this.width);
      var arrowPos = arrowMap[tile.direction];
      arrowCtx.drawImage(this.sprites.get('arrow'),
        arrowPos[0] * 100, arrowPos[1] * 100,
        100, 100, 0, 0, this.width, this.width);
    }

    if (cacheTile.command != tile.command || cacheTile.data != tile.data) {
      cacheTile.command = tile.command;
      cacheTile.data = tile.data;
      var commandCtx = this.canvases.get('command');
      var commandPos = commandMap[tile.command];
      commandCtx.clearRect(0, 0, this.width, this.width);
      commandCtx.drawImage(this.sprites.get('command'),
        commandPos[0] * 100, commandPos[1] * 100,
        100, 100, 0, 0, this.width, this.width);
      if (tile.data != null) {
        var text = '';
        if (tile.command == 'push') text = tile.data;
        if (tile.command == 'select') text = Hangul.final[tile.data];
        if (tile.command == 'move') text = Hangul.final[tile.data];
        commandCtx.font = (this.width * 0.3) + "px sans-serif";
        commandCtx.textAlign = "right";
        commandCtx.textBaseline = "bottom";
        commandCtx.fillStyle = "#fff";
        commandCtx.fillText(text, this.width - 3, this.width - 3);
      }
    }

    this.canvases.forEach(function(ctx) {
      ctx.restore();
    }, this);
  }
};

Renderer.prototype.render = function() {
  var state = this.interpreter.state;
  while (this.interpreter.updated.length > 0) {
    var pos = this.interpreter.updated.shift();
    this.updateTile(pos.x, pos.y);
  }
  if (state) this.updateTile(state.x, state.y);
};

module.exports = Renderer;

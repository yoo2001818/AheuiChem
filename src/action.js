var parser = require('./parser');
var Interpreter = require('./interpreter');

function TileAction(tile, tileX, tileY, key, data, renderer, callback) {
  this.tile = tile;
  this.key = key;
  this.data = data;
  this.tileX = tileX;
  this.tileY = tileY;
  this.renderer = renderer;
  this.callback = callback;
}

TileAction.prototype.exec = function() {
  this.before = this.tile[this.key];
  this.tile[this.key] = this.data;
  this.update();
}

TileAction.prototype.undo = function() {
  this.tile[this.key] = this.before;
  this.update();
}

TileAction.prototype.update = function() {
  // Fill the data with 0 if it's required and null.
  var command = Interpreter.CommandMap[this.tile.command];
  if(command != null && command.argument && this.tile.data == null) {
    this.tile.data = 0;
  }
  this.tile.original = parser.encodeSyllable(this.tile);
  this.renderer.map.set(this.tileX, this.tileY, this.tile);
  this.renderer.updateTile(this.tileX, this.tileY);
  if(this.callback) this.callback();
}

module.exports = TileAction;

var parser = require('./parser');
var Interpreter = require('./interpreter');

function TileAction(tile, tileX, tileY, data, renderer, callback) {
  this.tile = tile;
  this.data = data;
  this.tileX = tileX;
  this.tileY = tileY;
  this.renderer = renderer;
  this.callback = callback;
}

TileAction.prototype.exec = function() {
  this.before = {};
  for(var key in this.data) {
    this.before[key] = this.tile[key];
    this.tile[key] = this.data[key];
  }
  this.update();
}

TileAction.prototype.undo = function() {
  for(var key in this.before) {
    this.tile[key] = this.before[key];
  }
  this.update();
}

TileAction.prototype.update = function() {
  // Fill the data with 0 if it's required and null.
  var command = Interpreter.CommandMap[this.tile.command];
  if(command != null && command.argument && this.tile.data == null) {
    this.tile.data = 0;
  }
  if(this.tile.command == 'push' && this.tile.data > 9) {
    // Force set data to 0 as it can't handle larger than 9
    this.tile.data = 0;
  }
  this.tile.original = parser.encodeSyllable(this.tile);
  this.renderer.map.set(this.tileX, this.tileY, this.tile);
  this.renderer.updateTile(this.tileX, this.tileY);
  if(this.callback) this.callback();
}

module.exports = TileAction;

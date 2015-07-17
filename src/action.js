var parser = require('./parser');

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
  this.tile.original = parser.encodeSyllable(this.tile);
  this.renderer.map.set(this.tileX, this.tileY, this.tile);
  this.renderer.updateTile(this.tileX, this.tileY);
  if(this.callback) this.callback();
}

TileAction.prototype.undo = function() {
  this.tile[this.key] = this.before;
  this.tile.original = parser.encodeSyllable(this.tile);
  this.renderer.map.set(this.tileX, this.tileY, this.tile);
  this.renderer.updateTile(this.tileX, this.tileY);
  if(this.callback) this.callback();
}

module.exports = TileAction;

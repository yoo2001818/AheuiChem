var TileMap = require('./tilemap');

function Table(viewport, tilemap, updateCallback) {
  this.viewport = viewport;
  this.tilemap = tilemap;
  this.updateCallback = updateCallback;
  this.reset();
}

Table.prototype.reset = function() {
  this.domMap = new TileMap(this.tilemap.width, this.tilemap.height);
  this.createNodes();
}

Table.prototype.createNodes = function() {
  // Clear nodes in viewport
  while(this.viewport.firstChild) {
    this.viewport.removeChild(this.viewport.firstChild);
  }
  // Add nodes in viewport
  for(var y = 0; y < this.domMap.height; ++y) {
    var row = document.createElement('tr');
    this.viewport.appendChild(row);
    for(var x = 0; x < this.domMap.width; ++x) {
      var column = document.createElement('td');
      row.appendChild(column);
      column.tx = x;
      column.ty = y;
      this.domMap.set(x, y, column);
      this.updateNode(x, y);
    }
  }
}

Table.prototype.updateNode = function(x, y) {
  var node = this.domMap.get(x, y);
  var tile = this.tilemap.get(x, y);
  this.updateCallback(node, tile, x, y);
}

module.exports = Table;

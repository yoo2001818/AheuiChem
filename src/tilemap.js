function TileMap(width, height) {
  this.width = width;
  this.height = height;
  this.map = null;
  this.clear();
}

TileMap.prototype.clear = function() {
  this.map = [];
  for (var y = 0; y < this.height; ++y) {
    var row = [];
    for (var x = 0; x < this.width; ++x) {
      row[x] = null;
    }
    this.map[y] = row;
  }
};

TileMap.prototype.expand = function(width, height) {
  var x, y, row;
  var prevWidth = this.width;
  var prevHeight = this.height;
  if (width > this.width) this.width = width;
  if (height > this.height) this.height = height;
  for (y = 0; y < prevHeight; ++y) {
    row = this.map[y];
    for (x = prevWidth; x < this.width; ++x) {
      row[x] = null;
    }
  }
  for (y = prevHeight; y < this.height; ++y) {
    row = [];
    for (x = 0; x < this.width; ++x) {
      row[x] = null;
    }
    this.map[y] = row;
  }
};

TileMap.prototype.get = function(x, y) {
  if (y < 0 || y >= this.height) return null;
  if (x < 0 || x >= this.width) return null;
  return this.map[y][x];
};

TileMap.prototype.set = function(x, y, data) {
  if (y < 0 || y >= this.height) throw new Error('TileMap out of bounds');
  if (x < 0 || x >= this.width) throw new Error('TileMap out of bounds');
  this.map[y][x] = data;
};

TileMap.fromArray = function(arr) {
  var tileMap = new TileMap(0, arr.length);
  for(var y = 0; y < arr.length; ++y) {
    tileMap.expand(arr[y].length, 0);
    for(var x = 0; x < arr[y].length; ++x) {
      tileMap.set(x, y, arr[y][x]);
    }
  }
  return tileMap;
}

module.exports = TileMap;

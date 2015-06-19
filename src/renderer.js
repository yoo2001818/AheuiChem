var TileMap = require('./tilemap');
var parser = require('./parser');

var Renderer = function(viewport, interpreter) {
  this.viewport = viewport;
  this.interpreter = interpreter;
  this.reset();
}

Renderer.prototype.reset = function() {
  this.domMap = new TileMap(this.interpreter.map.width, this.interpreter.map.height);
  this.createNodes();
}

Renderer.prototype.createNodes = function() {
  // Clears nodes in viewport
  while(this.viewport.firstChild) {
    this.viewport.removeChild(this.viewport.firstChild);
  }
  // Adds nodes in viewport
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

Renderer.prototype.updateNode = function(x, y) {
  var node = this.domMap.get(x, y);
  var tile = this.interpreter.map.get(x, y);
  if(tile) {
    // text
    var div = document.createElement('div');
    node.appendChild(div);
    div.className = 'text';
    div.appendChild(document.createTextNode(tile.original));
    // arrow
    var div = document.createElement('div');
    node.appendChild(div);
    div.className = 'arrow '+tile.direction;
  }
  node.directions = {};
}

Renderer.prototype.preNext = function() {
}

Renderer.prototype.postNext = function() {
  var state = this.interpreter.state;
  while(state.updated.length > 0) {
    var pos = state.updated.shift();
    console.log(pos);
    var tile = this.interpreter.map.get(pos.x, pos.y);
    var prevNode = this.domMap.get(pos.x, pos.y);
    prevNode.className = "called";
    if(tile && tile.directions) {
      for(var key in tile.directions) {
        if(prevNode.directions[key]) continue;
        prevNode.directions[key] = true;
        var div = document.createElement('div');
        prevNode.appendChild(div);
        div.className = 'path '+key;
      }
    }
  }
  var node = this.domMap.get(state.x, state.y);
  node.className = "running";
}

module.exports = Renderer;

var Keyboard = require('./keyboard');
var TileMap = require('./tilemap');
var Table = require('./table');

function ToolBox(renderer) {
  this.selected = {
    type: 'arrow',
    name: 'none'
  };
  this.oldNode = null;
  this.renderer = renderer;
  this.scrollPane = null;
  this.generateTable();
}

ToolBox.prototype.generateTable = function() {
  var self = this;
  var tilemap = new TileMap(Keyboard.KeyShiftLayout[0].length,
    Keyboard.KeyShiftLayout.length);
  for(var y = 0; y < tilemap.height; ++y) {
    for(var x = 0; x < tilemap.width; ++x) {
      var key = Keyboard.KeyShiftLayout[y][x];
      tilemap.set(x, y, {
        value: Keyboard.EditorKeyMapping[key],
        key: key
      });
    }
  }
  // TODO no getElementById in class
  var viewport = document.getElementById('toolbox-table');
  this.table = new Table(viewport, tilemap, function(node, tile) {
    if(!tile || !tile.value) {
      node.parentNode.removeChild(node);
      return;
    }
    // ID is not required anymore, actually
    node.id = tile.value.join('-');
    node.className = tile.value[0];
    node.appendChild(document.createTextNode(tile.key));
    node.addEventListener('click', function() {
      self.changeSelected.apply(self, tile.value);
    });
  });
}

ToolBox.prototype.changeSelected = function(type, name) {
  // Invalidate old object
  if(this.oldNode) this.oldNode.className = this.selected.type;
  // Update
  this.selected.type = type;
  this.selected.name = name;
  var btn = document.getElementById(type + '-' + name);
  btn.className = type + ' selected';
  this.oldNode = btn;
};

module.exports = ToolBox;

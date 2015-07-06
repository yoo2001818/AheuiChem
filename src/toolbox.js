var Keyboard = require('./keyboard');
var TileMap = require('./tilemap');
var Table = require('./table');

var Directions = [
  'up',
  'left',
  'right',
  'down',
  'skip-up',
  'skip-left',
  'skip-right',
  'skip-down',
  'horizontal',
  'vertical',
  'reverse',
  'none'
];

var Commands = [
  'none',
  'end',
  'add',
  'multiply',
  'subtract',
  'divide',
  'mod',
  'pop',
  'push',
  'copy',
  'flip',
  'select',
  'move',
  'compare',
  'condition',
  'pop-unicode',
  'pop-number',
  'push-unicode',
  'push-number'
];

function ToolBox(renderer) {
  this.selected = {
    type: 'arrow',
    name: 'none'
  };
  this.renderer = renderer;
  this.scrollPane = null;
  this.keyboard = new Keyboard(this);
  this.generateTable();
  this.hookEvents();
}

ToolBox.prototype.generateTable = function() {
  // TODO no hardcoding
  var tilemap = new TileMap(11, 3);
  for(var y = 0; y < tilemap.height; ++y) {
    for(var x = 0; x < tilemap.width; ++x) {
      var key = Keyboard.KeyShiftLayout[y][x];
      tilemap.set(x, y, {
        value: Keyboard.KeyMapping[key],
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
    node.id = tile.value.join('-');
    node.className = tile.value[0];
    node.appendChild(document.createTextNode(tile.key));
  });
}

ToolBox.prototype.hookEvents = function() {
  var self = this;
  // hook events to DOM objects
  Directions.forEach(function(name) {
    var btn = document.getElementById('arrow-' + name);
    console.log('arrow-' + name, btn);
    if (btn) {
      btn.onclick = function() {
        self.changeSelected('arrow', name);
      };
    }
  });
  Commands.forEach(function(name) {
    var btn = document.getElementById('command-' + name);
    console.log('command-' + name, btn);
    if (btn) {
      btn.onclick = function() {
        self.changeSelected('command', name);
      };
    }
  });
};

ToolBox.prototype.changeSelected = function(type, name) {
  // Invalidate old object
  var oldBtn = document.getElementById(
    this.selected.type + '-' + this.selected.name);
  oldBtn.className = this.selected.type;
  // Update
  this.selected.type = type;
  this.selected.name = name;
  var btn = document.getElementById(type + '-' + name);
  btn.className = type + ' selected';
};

module.exports = ToolBox;

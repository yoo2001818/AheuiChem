var parser = require('./parser');
var ScrollPane = require('./scrollpane');

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
  this.hookEvents();
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

ToolBox.prototype.hookCanvas = function(check, callback) {
  var self = this;
  this.scrollPane = new ScrollPane(
    self.renderer.canvases.viewport.parentElement, function(e) {
    // http://stackoverflow.com/a/5932203
    var totalOffsetX = 0;
    var totalOffsetY = 0;
    var canvasX = 0;
    var canvasY = 0;
    var currentElement = self.renderer.canvases.viewport.parentElement;
    do {
      totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
      totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
      currentElement = currentElement.offsetParent;
    } while (currentElement);
    canvasX = e.pageX - totalOffsetX - document.body.scrollLeft;
    canvasY = e.pageY - totalOffsetY - document.body.scrollTop;
    e.preventDefault();
    var tileX = canvasX / self.renderer.width | 0;
    var tileY = canvasY / self.renderer.width | 0;
    if (!check(tileX, tileY)) return false;
    // Expand the map if required
    self.renderer.interpreter.map.expand(tileX + 1, tileY + 1);
    if (tileX + 1 >= self.renderer.interpreter.map.width ||
      tileY + 1 >= self.renderer.interpreter.map.height) {
      self.renderer.reset();
    }
    var tile = self.renderer.interpreter.map.get(tileX, tileY) || {
      direction: 'none',
      command: 'none',
      original: ' '
    };
    if (self.selected.type == 'arrow') tile.direction = self.selected.name;
    else tile.command = self.selected.name;
    tile.original = parser.encodeSyllable(tile);
    self.renderer.interpreter.map.set(tileX, tileY, tile);
    self.renderer.updateTile(tileX, tileY);
    callback(tileX, tileY, tile);
  });
  this.renderer.canvases.viewport.parentElement.addEventListener(
    'contextmenu', function(e) {
    var contextMenu = document.getElementById('contextMenu');
    contextMenu.style.display = "block";
    contextMenu.style.top = e.pageY + "px";
    contextMenu.style.left = e.pageX + "px";
    e.preventDefault();
    return false;
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

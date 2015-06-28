var parser = require('./parser');

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
  // TODO requires refactoring.
  var self = this;
  var prevX = 0,
    prevY = 0,
    moveX = 0,
    moveY = 0;

  function handleMouseMove(e) {
    var diffX = e.pageX - prevX;
    var diffY = e.pageY - prevY;
    self.renderer.canvases.viewport.parentElement.scrollTop -= diffY;
    self.renderer.canvases.viewport.parentElement.scrollLeft -= diffX;
    moveX -= diffX;
    moveY -= diffY;
    prevX = e.pageX;
    prevY = e.pageY;
  }

  function handleMouseUp(e) {
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('mousemove', handleMouseMove);
    if (Math.abs(moveX) < 1 && Math.abs(moveY) < 1) {
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
      if (!check(tileX, tileY)) return;
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
    }
    return true;
  }
  this.renderer.canvases.viewport.parentElement.addEventListener('mousedown',
    function(e) {
      prevX = e.pageX;
      prevY = e.pageY;
      moveX = 0;
      moveY = 0;
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mousemove', handleMouseMove);
      return true;
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
var Table = require('./table');
var TileMap = require('./tilemap');
var Keyboard = require('./keyboard');
var Hangul = require('./hangul');
var parser = require('./parser');

var PushKeyBinding = [
  [0, 2, 3, 4, 5],
  [6, 7, 8, 9]
];

/*
 ㄱㄴㄷㄹㄲㄳㄵㄶ
ㅁㅂㅅㅇㅈㄺㄻㄼㄽ
ㅊㅋㅌㅍㅎㄾㄿㅀㅄㅆ
*/
var FinalKeyBinding = [
  ' ㄱㄴㄷㄹㄲㄳㄵㄶ'.split(''),
  'ㅁㅂㅅㅇㅈㄺㄻㄼㄽ'.split(''),
  'ㅊㅋㅌㅍㅎㄾㄿㅀㅄㅆ'.split('')
];

// Generate keymap from table
var PushKeyBindingMap = {};
// TODO Implement a way to automate this.. I'm getting tired of this.
for(var y = 0; y < PushKeyBinding.length; ++y) {
  for(var x = 0; x < PushKeyBinding[y].length; ++x) {
    PushKeyBindingMap[Keyboard.KeyLayout[y][x]] = PushKeyBinding[y][x];
  }
}
var FinalKeyBindingMap = {};
// Yeah. totally.
for(var y = 0; y < FinalKeyBinding.length; ++y) {
  for(var x = 0; x < FinalKeyBinding[y].length; ++x) {
    FinalKeyBindingMap[Keyboard.KeyShiftLayout[y][x]] =
      Hangul.final.indexOf(FinalKeyBinding[y][x]);
  }
}

function ContextMenu(container, element, finalElement, renderer, clickCallback,
  keyboard) {
  this.container = container;
  this.element = element;
  this.finalElement = finalElement;
  this.hideEvent = this.hide.bind(this);
  this.init();
  this.renderer = renderer;
  this.clickCallback = clickCallback;
  this.keyboard = keyboard;
  this.tileX = null;
  this.tileY = null;
  this.tile = null;
}

ContextMenu.prototype.update = function() {
  this.tile.original = parser.encodeSyllable(this.tile);
  this.renderer.map.set(this.tileX, this.tileY, this.tile);
  this.renderer.updateTile(this.tileX, this.tileY);
  if(this.clickCallback) this.clickCallback(this.tileX, this.tileY, this.tile);
}

ContextMenu.prototype.init = function() {
  var self = this;
  // TODO should support generating tilemap from an array
  var tilemap = new TileMap(5, 2);
  for(var y = 0; y < tilemap.height; ++y) {
    for(var x = 0; x < tilemap.width; ++x) {
      tilemap.set(x, y, PushKeyBinding[y][x]);
    }
  }
  // TODO no getElementById in class
  // This is exactly same situation as toolbox
  var viewport = document.getElementById('push-table');
  var pushTable = new Table(viewport, tilemap, function(node, tile, x, y) {
    if(tile == null) {
      node.parentNode.removeChild(node);
      return;
    }
    node.id = 'push-table-'+tile;
    node.appendChild(document.createTextNode(tile));
    var divNode = document.createElement('div');
    divNode.className = 'key';
    divNode.appendChild(document.createTextNode(Keyboard.KeyLayout[y][x]));
    node.appendChild(divNode);
    node.addEventListener('click', function() {
      self.tile.data = tile;
      self.update();
    });
  });
  var tilemap = new TileMap(10, 3);
  for(var y = 0; y < tilemap.height; ++y) {
    for(var x = 0; x < tilemap.width; ++x) {
      tilemap.set(x, y, FinalKeyBinding[y][x]);
    }
  }
  // ... No Ctrl+C, Ctrl+V Please?
  var viewport = document.getElementById('final-table');
  var pushTable = new Table(viewport, tilemap, function(node, tile, x, y) {
    if(tile == null) {
      node.parentNode.removeChild(node);
      return;
    }
    node.id = 'final-table-'+tile;
    node.appendChild(document.createTextNode(tile));
    var divNode = document.createElement('div');
    divNode.className = 'key';
    divNode.appendChild(document.createTextNode(Keyboard.KeyShiftLayout[y][x]));
    node.appendChild(divNode);
    node.addEventListener('click', function() {
      self.tile.data = Hangul.final.indexOf(tile);
      self.update();
    });
  });
}

ContextMenu.prototype.show = function(x, y) {
  this.container.style.display = 'block';
  this.container.addEventListener('click', this.hideEvent);
  this.container.addEventListener('contextmenu', this.hideEvent);
  this.element.style.top = y+'px';
  this.element.style.left = x+'px';
  this.finalElement.style.top = y+'px';
  this.finalElement.style.left = x+'px';
  var self = this;
  // TODO it could be better really.
  if(this.tile.command == 'push') {
    this.finalElement.style.display = 'none';
    this.element.style.display = 'block';
    // Push keyboard state
    this.keyboard.push({
      map: PushKeyBindingMap,
      callback: function(data) {
        self.tile.data = data;
        self.update();
        self.hide();
      }
    });
  } else {
    this.finalElement.style.display = 'block';
    this.element.style.display = 'none';
    // Push keyboard state
    this.keyboard.push({
      map: FinalKeyBindingMap,
      callback: function(data) {
        self.tile.data = data;
        self.update();
        self.hide();
      }
    });
  }
}

ContextMenu.prototype.hide = function(e) {
  this.container.removeEventListener('click', this.hideEvent);
  this.container.removeEventListener('contextmenu', this.hideEvent);
  this.container.style.display = 'none';
  this.element.style.display = 'none';
  this.keyboard.pop();
  if(e) {
    e.preventDefault();
    return false;
  }
}

module.exports = ContextMenu;

var Table = require('./table');
var TileMap = require('./tilemap');

var PushKeyBinding = [
  [0, 2, 3, 4, 5],
  [6, 7, 8, 9, -1]
];

/*
 ㄱㄴㄷㄹㄲㄳㄵㄶ
ㅁㅂㅅㅇㅈㄺㄻㄼㄽ
ㅊㅋㅌㅍㅎㄾㄿㅀㅄㅆ
*/
var FinalKeyBinding = [
];

function ContextMenu(container, element) {
  this.container = container;
  this.element = element;
  this.hideEvent = this.hide.bind(this);
  this.init();
  this.renderer = null;
  this.tileX = null;
  this.tileY = null;
  this.tile = null;
}

ContextMenu.prototype.update = function() {
  this.renderer.map.set(this.tileX, this.tileY, this.tile);
  this.renderer.updateTile(this.tileX, this.tileY);
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
  var pushTable = new Table(viewport, tilemap, function(node, tile) {
    if(tile == null) {
      node.parentNode.removeChild(node);
      return;
    }
    node.id = 'push-table-'+tile;
    node.appendChild(document.createTextNode(tile));
    node.addEventListener('click', function() {
      self.tile.data = tile;
      self.update();
    });
  });
}

ContextMenu.prototype.show = function(x, y) {
  this.container.style.display = 'block';
  this.container.addEventListener('click', this.hideEvent);
  this.container.addEventListener('contextmenu', this.hideEvent);
  this.element.style.display = 'block';
  this.element.style.top = y+'px';
  this.element.style.left = x+'px';
}

ContextMenu.prototype.hide = function(e) {
  this.container.removeEventListener('click', this.hideEvent);
  this.container.removeEventListener('contextmenu', this.hideEvent);
  this.container.style.display = 'none';
  this.element.style.display = 'none';
  if(e) {
    e.preventDefault();
    return false;
  }
}

module.exports = ContextMenu;

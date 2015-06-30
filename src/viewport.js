var ScrollPane = require('./scrollpane');
var parser = require('./parser');

function Viewport(element, toolbox, renderer, checkCallback, clickCallback) {
  this.element = element;
  this.toolbox = toolbox;
  this.renderer = renderer;
  this.scrollpane = new ScrollPane(element, this.handleMouseClick.bind(this));
  this.checkCallback = checkCallback;
  this.clickCallback = clickCallback;
}

Viewport.prototype.hookEvents = function() {
  this.element.addEventListener('contextmenu', this.handleContext.bind(this));
}

Viewport.prototype.handleMouseClick = function(e) {
  // TODO it could be better.
  // http://stackoverflow.com/a/5932203
  var totalOffsetX = 0;
  var totalOffsetY = 0;
  var canvasX = 0;
  var canvasY = 0;
  var currentElement = this.element;
  do {
    totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
    totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
    currentElement = currentElement.offsetParent;
  } while (currentElement);
  canvasX = e.pageX - totalOffsetX - document.body.scrollLeft;
  canvasY = e.pageY - totalOffsetY - document.body.scrollTop;
  e.preventDefault();
  var tileX = canvasX / this.renderer.width | 0;
  var tileY = canvasY / this.renderer.width | 0;
  if (!this.checkCallback(tileX, tileY)) return false;
  // Expand the map if required
  this.renderer.map.expand(tileX + 1, tileY + 1);
  if (tileX + 1 >= this.renderer.map.width ||
    tileY + 1 >= this.renderer.map.height) {
    this.renderer.reset();
  }
  var tile = this.renderer.map.get(tileX, tileY) || {
    direction: 'none',
    command: 'none',
    original: ' '
  };
  var selected = this.toolbox.selected;
  if (selected.type == 'arrow') tile.direction = selected.name;
  else tile.command = selected.name;
  tile.original = parser.encodeSyllable(tile);
  this.renderer.map.set(tileX, tileY, tile);
  this.renderer.updateTile(tileX, tileY);
  this.clickCallback(tileX, tileY, tile);
}

Viewport.prototype.handleContext = function(e) {
  // TODO ignore it now; should be changed
  /*
    var contextMenu = document.getElementById('contextMenu');
    contextMenu.style.display = "block";
    contextMenu.style.top = e.pageY + "px";
    contextMenu.style.left = e.pageX + "px";
  */
  e.preventDefault();
  return false;
}

module.exports = Viewport;

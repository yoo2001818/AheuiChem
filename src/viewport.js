var ScrollPane = require('./scrollpane');
var parser = require('./parser');

function Viewport(element, toolbox, renderer, contextmenu,
  checkCallback, clickCallback) {
  this.element = element;
  this.toolbox = toolbox;
  this.renderer = renderer;
  this.contextmenu = contextmenu;
  this.scrollpane = new ScrollPane(element, this.handleMouseClick.bind(this));
  this.checkCallback = checkCallback;
  this.clickCallback = clickCallback;
  this.hookEvents();
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
  totalOffsetX += this.renderer.canvases.viewport.offsetLeft;
  totalOffsetY += this.renderer.canvases.viewport.offsetTop;
  totalOffsetX += document.body.scrollLeft;
  totalOffsetY += document.body.scrollTop;
  canvasX = e.pageX - totalOffsetX;
  canvasY = e.pageY - totalOffsetY;
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
  if(e.button == 0) {
    var selected = this.toolbox.selected;
    if (selected.type == 'arrow') tile.direction = selected.name;
    else tile.command = selected.name;
    tile.original = parser.encodeSyllable(tile);
    this.renderer.map.set(tileX, tileY, tile);
    this.renderer.updateTile(tileX, tileY);
    this.clickCallback(tileX, tileY, tile);
  } else if(e.button == 2) {
    var contextX = tileX * this.renderer.width + totalOffsetX;
    var contextY = (tileY+1) * this.renderer.width + totalOffsetY;
    this.contextmenu.renderer = this.renderer;
    this.contextmenu.tileX = tileX;
    this.contextmenu.tileY = tileY;
    this.contextmenu.tile = tile;
    this.contextmenu.show(contextX, contextY);
  }
}

Viewport.prototype.handleContext = function(e) {
  e.preventDefault();
  return false;
}

module.exports = Viewport;

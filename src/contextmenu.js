function ContextMenu(element) {
  this.element = element;
}

ContextMenu.prototype.show = function(x, y) {
  this.element.style.display = 'block';
  this.element.style.top = y+'px';
  this.element.style.left = x+'px';
}

ContextMenu.prototype.hide = function() {
  this.element.style.display = 'none';
}

module.exports = ContextMenu;

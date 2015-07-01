function ContextMenu(container, element) {
  this.container = container;
  this.element = element;
  this.hideEvent = this.hide.bind(this);
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

function MenuPane(panes, buttons) {
  this.panes = panes;
  this.buttons = buttons;
  this.selected = -1;
  this.registerEvents();
}

MenuPane.prototype.registerEvents = function() {
  var self = this;
  this.buttons.forEach(function(element, key) {
    element.onclick = function() {
      if(self.selected == key) {
        self.show(-1);
      } else {
        self.show(key);
      }
    }
  });
  this.update();
}

MenuPane.prototype.show = function(index) {
  this.selected = index;
  this.update();
}

MenuPane.prototype.update = function() {
  this.buttons.forEach(function(element, key) {
    if(this.selected == key) {
      element.className = 'menu-btn selected';
    } else {
      element.className = 'menu-btn';
    }
  }, this);
  this.panes.forEach(function(element, key) {
    if(this.selected == key) {
      element.style.display = 'block';
    } else {
      element.style.display = 'none';
    }
  }, this);
}

module.exports = MenuPane;

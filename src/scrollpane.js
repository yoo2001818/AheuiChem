function ScrollPane(viewport, clickCallback) {
  this.viewport = viewport;
  this.clickCallback = clickCallback;
  this.registerEvents();
}

ScrollPane.prototype.registerEvents = function() {
  var self = this;
  var prevX = 0;
  var prevY = 0;
  var moveX = 0;
  var moveY = 0;
  function handleMouseUp(e) {
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('mousemove', handleMouseMove);
    if (Math.abs(moveX) < 1 && Math.abs(moveY) < 1 && self.clickCallback) {
      self.clickCallback(e);
    }
    return false;
  }
  function handleMouseMove(e) {
    var diffX = e.pageX - prevX;
    var diffY = e.pageY - prevY;
    self.viewport.scrollTop -= diffY;
    self.viewport.scrollLeft -= diffX;
    moveX -= diffX;
    moveY -= diffY;
    prevX = e.pageX;
    prevY = e.pageY;
  }
  this.viewport.addEventListener('mousedown', function(e) {
    if (e.button != 0) return;
    prevX = e.pageX;
    prevY = e.pageY;
    moveX = 0;
    moveY = 0;
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);
    e.preventDefault();
    return false;
  });
}

module.exports = ScrollPane;

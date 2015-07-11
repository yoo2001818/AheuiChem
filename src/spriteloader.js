function SpriteLoader(callback) {
  this.sprites = [];
  this.loadCount = 0;
  this.callback = callback;
}

SpriteLoader.prototype.get = function(name) {
  return this.sprites[name];
}

SpriteLoader.prototype.load = function(name, src) {
  var img = new Image();
  img.src = src;
  img.onload = (function() {
    this.sprites[name] = img;
    this.handleDone();
  }).bind(this);
  this.loadCount ++;
}

SpriteLoader.prototype.handleDone = function() {
  this.loadCount --;
  if(this.loadCount == 0) {
    if(this.callback) this.callback();
  }
}

module.exports = SpriteLoader;

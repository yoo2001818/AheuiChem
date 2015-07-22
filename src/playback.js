function Playback(interpreter, renderer, callback, resetCallback) {
  this.interpreter = interpreter;
  this.renderer = renderer;
  this.callback = callback;
  this.resetCallback = resetCallback;
  this.running = false;
  this.registerEvents();
}

Playback.prototype.registerEvents = function() {
  var self = this;
  // TODO let's not use getElementById in classes
  document.getElementById('icon-play').onclick = function() {
    document.activeElement.blur();
    self.running = true;
  };
  document.getElementById('icon-pause').onclick = function() {
    document.activeElement.blur();
    self.running = false;
  };
  document.getElementById('icon-step').onclick = function() {
    document.activeElement.blur();
    self.step();
    self.running = false;
  };
  document.getElementById('icon-stop').onclick = function() {
    self.resetCallback();
  };
  setInterval(function() {
    if (!self.running) return;
    self.step();
  }, 20);
}

Playback.prototype.step = function() {
  if(!this.interpreter || !this.renderer) return;
  this.interpreter.next();
  this.renderer.render();
  if(this.interpreter.state.breakpoint) this.running = false;
  if(!this.interpreter.state.running) this.running = false;
  if(this.callback) this.callback();
}

module.exports = Playback;

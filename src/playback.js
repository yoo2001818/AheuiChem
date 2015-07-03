function Playback(interpreter, renderer, callback) {
  this.interpreter = interpreter;
  this.renderer = renderer;
  this.callback = callback;
  this.running = false;
  this.registerEvents();
}

Playback.prototype.registerEvents = function() {
  var self = this;
  // TODO let's not use getElementById in classes
  document.getElementById('codeForm-resume').onclick = function() {
    self.running = true;
  };
  document.getElementById('codeForm-pause').onclick = function() {
    self.running = false;
  };
  document.getElementById('codeForm-step').onclick = function() {
    self.step();
    self.running = false;
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
  if(this.callback) this.callback();
}

module.exports = Playback;

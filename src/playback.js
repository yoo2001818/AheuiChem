function Playback(interpreter, renderer, callback, resetCallback) {
  this.interpreter = interpreter;
  this.renderer = renderer;
  this.callback = callback;
  this.resetCallback = resetCallback;
  this.running = false;
  this.playing = false;
  this.registerEvents();
}

Playback.prototype.registerEvents = function() {
  var self = this;
  // TODO let's not use getElementById in classes
  document.getElementById('icon-play').onclick = function() {
    document.activeElement.blur();
    self.playing = true;
    self.running = true;
    self.update();
  };
  document.getElementById('icon-pause').onclick = function() {
    document.activeElement.blur();
    if(!self.playing) return;
    self.running = false;
    self.update();
  };
  document.getElementById('icon-step').onclick = function() {
    document.activeElement.blur();
    self.playing = true;
    self.step();
    self.running = false;
    self.update();
  };
  document.getElementById('icon-stop').onclick = function() {
    self.playing = false;
    self.running = false;
    self.resetCallback();
    self.update();
  };
  setInterval(function() {
    if (!self.running) return;
    self.step();
  }, 20);
  self.update();
}

Playback.prototype.update = function() {
  // TODO PLEASE CLEANUP THIS CODE
  if(this.playing) {
    // Stop button is enabled
    document.getElementById('icon-stop').className = 'icon';
    if(this.running) {
      // Play button is selected
      document.getElementById('icon-play').className = 'icon selected';
      document.getElementById('icon-pause').className = 'icon';
      document.getElementById('icon-step').className = 'icon disabled';
    } else {
      // Pause button is selected
      document.getElementById('icon-play').className = 'icon';
      document.getElementById('icon-pause').className = 'icon selected';
      document.getElementById('icon-step').className = 'icon';
    }
  } else {
    // Stop, pause button is disabled
    document.getElementById('icon-stop').className = 'icon disabled';
    document.getElementById('icon-play').className = 'icon';
    document.getElementById('icon-pause').className = 'icon disabled';
  }
}

Playback.prototype.step = function() {
  if(!this.interpreter || !this.renderer) return;
  this.interpreter.next();
  this.renderer.render();
  if(this.interpreter.state.breakpoint) {
    this.running = false;
    this.update();
  }
  if(!this.interpreter.state.running) {
    this.running = false;
    this.stopped = true;
    this.update();
  }
  if(this.callback) this.callback();
}

module.exports = Playback;

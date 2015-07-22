function Playback(interpreter, renderer, callback, resetCallback) {
  this.interpreter = interpreter;
  this.renderer = renderer;
  this.callback = callback;
  this.resetCallback = resetCallback;
  this.running = false;
  this.playing = false;
  this.intervalId = -1;
  this.delay = 400;
  this.times = 1;
  this.registerEvents();
}

Playback.prototype.resetInterval = function() {
  var self = this;
  if(this.intervalId != -1) clearInterval(this.intervalId);
  this.intervalId = setInterval(function() {
    if (!self.running) return;
    self.step();
  }, this.delay);
}

Playback.prototype.updateDelay = function(id) {
  var element = document.getElementById('icon-play'+id+'x');
  if(this.preElement) {
    this.preElement.className = 'icon';
    this.preElement = element;
  }
  element.className = 'icon selected';
  // Reset timing
  this.times = 1;
  if(id == 1) this.delay = 400;
  if(id == 2) this.delay = 20;
  if(id == 3) {
    this.delay = 20;
    this.times = 10;
  }
  this.resetInterval();
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
    self.step(true);
    self.running = false;
    self.update();
  };
  document.getElementById('icon-stop').onclick = function() {
    self.playing = false;
    self.running = false;
    self.resetCallback();
    self.update();
  };
  document.getElementById('icon-play1x').onclick =
    this.updateDelay.bind(this, 1);
  document.getElementById('icon-play2x').onclick =
    this.updateDelay.bind(this, 2);
  document.getElementById('icon-play3x').onclick =
    this.updateDelay.bind(this, 3);
  this.preElement = document.getElementById('icon-play1x');
  this.resetInterval();
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

Playback.prototype.step = function(once) {
  if(!this.interpreter || !this.renderer) return;
  for(var i = 0; i < this.times; ++i) {
    this.interpreter.next();
    if(this.interpreter.state.breakpoint) {
      this.running = false;
      this.update();
      break;
    }
    if(!this.interpreter.state.running) {
      this.running = false;
      this.stopped = true;
      this.update();
      break;
    }
    if(once) break;
  }
  this.renderer.render();
  if(this.callback) this.callback();
}

module.exports = Playback;

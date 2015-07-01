
var KeyLayout = [
  'qwert', 'asdfg', 'zxcvb'
].map(function(v) {
  return v.split('');
});

var KeyMapping = {
  'q': ['arrow', 'none'],
  'w': ['arrow', 'up'],
  'e': ['command', 'none'],
  'r': ['command', 'select'],
  't': ['command', 'move'],
  'a': ['arrow', 'left'],
  's': ['arrow', 'down'],
  'd': ['arrow', 'right'],
  'f': ['command', 'push'],
  'g': ['command', 'pop'],
  'z': ['command', 'subtract'],
  'x': ['command', 'divide'],
  'c': ['command', 'add'],
  'v': ['command', 'multiply'],
  'b': ['command', 'mod'],
  'Q': ['arrow', 'reverse'],
  'W': ['arrow', 'skip-up'],
  'E': ['command', 'end'],
  'R': ['command', 'condition'],
  'T': ['command', 'compare'],
  'A': ['arrow', 'skip-left'],
  'S': ['arrow', 'skip-down'],
  'D': ['arrow', 'skip-right'],
  'F': ['command', 'copy'],
  'G': ['command', 'flip'],
  'Z': ['arrow', 'horizontal'],
  'X': ['arrow', 'vertical'],
  'C': ['command', 'pop-number'],
  'V': ['command', 'pop-unicode'],
  'B': ['command', 'push-unicode'],
  'N': ['command', 'push-number']
};

function Keyboard(toolbox) {
  this.toolbox = toolbox;
  this.registerEvents();
}

Keyboard.prototype.registerEvents = function() {
  var self = this;
  document.addEventListener('keypress', function(e) {
    var keyPressed = e.key || String.fromCharCode(e.charCode);
    if(KeyMapping[keyPressed]) {
      var mapping = KeyMapping[keyPressed];
      self.toolbox.changeSelected(mapping[0], mapping[1]);
    }
  });
}

module.exports = Keyboard;

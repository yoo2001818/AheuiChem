var KeyLayout = [
  'qwert', 'asdfg', 'zxcvb'
].map(function(v) {
  return v.split('');
});

var KeyShiftLayout = [
  'qwertQWERT', 'asdfgASDFG', 'zxcvbZXCVBN'
].map(function(v) {
  return v.split('');
});

var EditorKeyMapping = {
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

function Keyboard() {
  this.stack = [];
  this.registerEvents();
}

Keyboard.prototype.push = function(entry) {
  this.stack.push(entry);
}

Keyboard.prototype.pop = function() {
  return this.stack.pop();
}

Keyboard.prototype.registerEvents = function() {
  var self = this;
  document.addEventListener('keypress', function(e) {
    var keyPressed = e.key || String.fromCharCode(e.charCode);
    var entry = self.stack[self.stack.length - 1];
    if(!entry || !entry.map) return;
    if(entry.map[keyPressed] != undefined) {
      entry.callback(entry.map[keyPressed]);
    }
  });
}

Keyboard.KeyLayout = KeyLayout;
Keyboard.KeyShiftLayout = KeyShiftLayout;
Keyboard.EditorKeyMapping = EditorKeyMapping;

module.exports = Keyboard;

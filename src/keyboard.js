var KeyMapping = {
  'q': ['command', 'push'], // ㅂ
  'Q': ['command', 'copy'], // ㅃ
  'w': ['command', 'compare'], // ㅈ
  'e': ['command', 'add'], // ㄷ
  'E': ['command', 'multiply'], // ㄸ
  't': ['command', 'select'], // ㅅ
  'T': ['command', 'move'], // ㅆ
  'a': ['command', 'pop'], // ㅁ
  's': ['command', 'divide'], // ㄴ
  'd': ['command', 'none'], // ㅇ
  'f': ['command', 'mod'], // ㄹ
  'g': ['command', 'end'], // ㅎ
  'x': ['command', 'subtract'], // ㅌ
  'c': ['command', 'condition'], // ㅊ
  'v': ['command', 'flip'], // ㅍ
  'y': ['arrow', 'skip-up'], // ㅛ
  'u': ['arrow', 'skip-left'], // ㅕ
  'i': ['arrow', 'skip-right'], // ㅑ
  'o': ['arrow', 'none'], // ㅐ
  'h': ['arrow', 'up'], // ㅗ
  'j': ['arrow', 'left'], // ㅓ
  'k': ['arrow', 'right'], // ㅏ
  'l': ['arrow', 'vertical'], // ㅣ
  'b': ['arrow', 'skip-down'], // ㅠ
  'n': ['arrow', 'down'], // ㅜ
  'm': ['arrow', 'horizontal'], // ㅡ
  'p': ['arrow', 'reverse'], // ㅔ (Mapped to ㅢ)
  '[': ['command', 'pop-unicode'],
  '{': ['command', 'push-unicode'],
  ']': ['command', 'pop-number'],
  '}': ['command', 'push-number']
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

var Directions = [
  'up',
  'left',
  'right',
  'down',
  'skip-up',
  'skip-left',
  'skip-right',
  'skip-down',
  'horizontal',
  'vertical',
  'reverse',
  'none'
];

var Commands = [
  'none',
  'end',
  'add',
  'multiply',
  'subtract',
  'divide',
  'mod',
  'pop',
  'push',
  'copy',
  'flip',
  'select',
  'move',
  'compare',
  'condition',
  'pop-unicode',
  'pop-number',
  'push-unicode',
  'push-number'
];

function ToolBox(renderer) {
  this.selected = {
    type: 'arrow',
    name: 'none'
  }
  this.hookEvents();
}

ToolBox.prototype.hookEvents = function() {
  var self = this;
  // hook events to DOM objects
  Directions.forEach(function(name) {
    var btn = document.getElementById('arrow-'+name);
    console.log('arrow-'+name, btn);
    if(btn) {
      btn.onclick = function() {
        self.changeSelected('arrow', name);
      }
    }
  });
  Commands.forEach(function(name) {
    var btn = document.getElementById('command-'+name);
    console.log('command-'+name, btn);
    if(btn) {
      btn.onclick = function() {
        self.changeSelected('command', name);
      }
    }
  });
}

ToolBox.prototype.changeSelected = function(type, name) {
  // Invalidate old object
  var oldBtn = document.getElementById(
    this.selected.type+'-'+this.selected.name);
  oldBtn.className = this.selected.type;
  // Update
  this.selected.type = type;
  this.selected.name = name;
  var btn = document.getElementById(type+'-'+name);
  btn.className = type+' selected';
}

module.exports = ToolBox;
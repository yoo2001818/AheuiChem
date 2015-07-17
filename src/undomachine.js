// Saves undo stack and preforms undo
function UndoMachine() {
  this.undoStack = [];
  this.redoStack = [];
}

UndoMachine.prototype.run = function(action) {
  // Clear redo stack, as it becomes unusable
  this.redoStack = [];
  // Execute action...
  action.exec();
  this.undoStack.push(action);
}

UndoMachine.prototype.canUndo = function() {
  return this.undoStack.length >= 1;
}

UndoMachine.prototype.undo = function() {
  if(!this.canUndo()) return false;
  // Undo action and push to redo stack
  var action = this.undoStack.pop();
  action.undo();
  this.redoStack.push(action);
  return action;
}

UndoMachine.prototype.canRedo = function() {
  return this.redoStack.length >= 1;
}

UndoMachine.prototype.redo = function() {
  if(!this.canRedo()) return false;
  // Redo action and push to undo stack..
  var action = this.redoStack.pop();
  action.exec();
  this.undoStack.push(action);
  return action;
}

UndoMachine.prototype.reset = function() {
  this.undoStack = [];
  this.redoStack = [];
}

module.exports = UndoMachine;

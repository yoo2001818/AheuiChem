function Memory() {}

Memory.prototype.push = function(data) {};

Memory.prototype.pull = function() {};

Memory.prototype.canPull = function(quantity) {};

Memory.prototype.copy = function() {};

Memory.prototype.flip = function() {};

function Stack() {
  this.data = [];
}

Stack.prototype.push = function(data) {
  this.data.push(data);
};

Stack.prototype.pull = function() {
  return this.data.pop();
};

Stack.prototype.canPull = function(quantity) {
  return this.data.length >= quantity;
};

Stack.prototype.copy = function() {
  if (!this.canPull(1)) return false;
  var data = this.pull();
  this.data.push(data);
  this.data.push(data);
  return true;
};

Stack.prototype.flip = function() {
  if (!this.canPull(2)) return false;
  var a = this.pull();
  var b = this.pull();
  this.data.push(a);
  this.data.push(b);
  return true;
};

function Queue() {
  this.data = [];
}

Queue.prototype.push = function(data) {
  this.data.push(data);
};

Queue.prototype.pull = function() {
  return this.data.shift();
};

Queue.prototype.canPull = function(quantity) {
  return this.data.length >= quantity;
};

Queue.prototype.copy = function() {
  if (!this.canPull(1)) return false;
  var data = this.data[0];
  this.data.unshift(data);
  return true;
};

Queue.prototype.flip = function() {
  if (!this.canPull(2)) return false;
  var a = this.pull();
  var b = this.pull();
  this.data.unshift(a);
  this.data.unshift(b);
  return true;
};

module.exports.Memory = Memory;
module.exports.Stack = Stack;
module.exports.Queue = Queue;

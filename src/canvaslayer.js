function CanvasLayer(viewport, layerNames, width, height) {
  this.layers = [];
  this.layersByName = {};
  this.layerContexts = [];
  this.layerContextsByName = {};
  this.width = width;
  this.height = height;
  this.viewport = viewport;
  viewport.style.position = 'relative';
  viewport.style.width = width+'px';
  viewport.style.height = height+'px';
  while(viewport.firstChild) viewport.removeChild(viewport.firstChild);
  for(var i = 0; i < layerNames.length; ++i) {
    var layerName = layerNames[i];
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.position = 'absolute';
    var ctx = canvas.getContext('2d');
    this.layers[i] = canvas;
    this.layersByName[layerName] = canvas;
    this.layerContexts[i] = ctx;
    this.layerContextsByName[layerName] = ctx;
    viewport.appendChild(canvas);
  }
}

CanvasLayer.prototype.setSize = function(width, height) {
  this.viewport.style.width = width+'px';
  this.viewport.style.height = height+'px';
  this.width = width;
  this.height = height;
  for(var i = 0; i < this.layers.length; ++i) {
    var layer = this.layers[i];
    layer.width = width;
    layer.height = height;
  }
};

CanvasLayer.prototype.get = function(layerName) {
  return this.layerContextsByName[layerName];
};

CanvasLayer.prototype.getCanvas = function(layerName) {
  return this.layersByName[layerName];
};

CanvasLayer.prototype.forEach = function(callback, thisObj) {
  this.layerContexts.forEach(callback, thisObj);
};

CanvasLayer.prototype.canvasForEach = function(callback, thisObj) {
  this.layers.forEach(callback, thisObj);
};

CanvasLayer.prototype.dump = function(targetCanvas) {
  var ctx = targetCanvas.getContext('2d');
  targetCanvas.width = this.width;
  targetCanvas.height = this.height;
  this.canvasForEach(function(canvas) {
    ctx.drawImage(canvas, 0, 0);
  });
};

module.exports = CanvasLayer;

var assert = require('assert');
var TileMap = require('../src/tilemap');
describe('TileMap', function() {
  var tileMap;
  beforeEach(function() {
    tileMap = new TileMap(3, 4);
  });
  describe('#clear()', function() {
    it('should set map size correctly', function() {
      tileMap.clear();
      assert.equal(4, tileMap.map.length);
      assert.equal(3, tileMap.map[0].length);
    });
    it('should clear the array', function() {
      tileMap.clear();
      var empty = [null, null, null];
      assert.deepEqual([empty, empty, empty, empty], tileMap.map);
    });
  });
  describe('#expand()', function() {
    it('should set map size correctly', function() {
      tileMap.expand(4, 5);
      assert.equal(5, tileMap.map.length);
      assert.equal(4, tileMap.map[0].length);
    });
    it('should not become smaller than its original size', function() {
      tileMap.expand(2, 5);
      assert.equal(5, tileMap.map.length);
      assert.equal(3, tileMap.map[0].length);
    });
    it('should retain its contents', function() {
      tileMap.map = [[1,1,1],[1,1,1],[1,1,1],[1,1,1]];
      tileMap.expand(4, 5);
      for(var y = 0; y < 4; ++y) {
        for(var x = 0; x < 3; ++x) {
          assert.equal(1, tileMap.map[y][x]);
        }
      }
    });
  });
  describe('#get()', function() {
    it('should return its content correctly', function() {
      tileMap.map = [[1,2,3],[4,5,6],[7,8,9],[0,1,2]];
      assert.equal(2, tileMap.get(1, 0));
      assert.equal(9, tileMap.get(2, 2));
    });
    it('should return null if out of bounds', function() {
      assert.equal(null, tileMap.get(-1, 0));
      assert.equal(null, tileMap.get(0, -1));
      assert.equal(null, tileMap.get(3, 0));
      assert.equal(null, tileMap.get(0, 4));
    });
  });
  describe('#set()', function() {
    it('should set its content correctly', function() {
      tileMap.set(1, 0, 2);
      tileMap.set(2, 2, 9);
      assert.equal(2, tileMap.get(1, 0));
      assert.equal(9, tileMap.get(2, 2));
    });
  });
});

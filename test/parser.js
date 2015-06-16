var assert = require('assert');
var parser = require('../src/parser');
describe('parser', function() {
  describe('parseSyllable()', function() {
    it('should return right results', function() {
      assert.deepEqual({
        direction: 'right',
        command: 'push-unicode'
      }, parser.parseSyllable('밯'));
      assert.deepEqual({
        direction: 'right',
        command: 'pop-number'
      }, parser.parseSyllable('망'));
      assert.deepEqual({
        direction: 'vertical',
        command: 'end'
      }, parser.parseSyllable('히'));
      assert.deepEqual({
        direction: 'left',
        command: 'push',
        data: 2
      }, parser.parseSyllable('벅'));
      assert.deepEqual({
        direction: 'none',
        command: 'select',
        data: 1
      }, parser.parseSyllable('색'));
    });
  });
});

var TileMap = require('./tilemap');
var Hangul = require('./hangul');

var DirectionMap = {
  // Move cursor to the direction
  'ㅗ': 'up',
  'ㅓ': 'left',
  'ㅏ': 'right',
  'ㅜ': 'down',
  // Move cursor twice to the direction
  'ㅛ': 'skip-up',
  'ㅕ': 'skip-left',
  'ㅑ': 'skip-right',
  'ㅠ': 'skip-down',
  // Reverse direction if origin direction is up or down
  'ㅡ': 'horizontal',
  // Reverse direction if origin direction is left or right
  'ㅣ': 'vertical',
  // Reverse direction
  'ㅢ': 'reverse',
  'ㅐㅔㅒㅖㅘㅙㅚㅝㅞㅟ': 'none'
};

var DirectionReverseMap = {};
Object.keys(DirectionMap).forEach(function(k) {
  DirectionReverseMap[DirectionMap[k]] = k;
});

var CommandMap = {
  // ㅇ 묶음
  'ㅇㄱㄲㅉㅋ': 'none',
  'ㅎ': 'end',
  // ㄷ 묶음 - 셈
  'ㄷ': 'add',
  'ㄸ': 'multiply',
  'ㅌ': 'subtract',
  'ㄴ': 'divide',
  'ㄹ': 'mod',
  // ㅁ 묶음 - 저장공간
  'ㅁ': 'pop',
  'ㅂ': 'push',
  'ㅃ': 'copy',
  'ㅍ': 'flip',
  // ㅅ 묶음 - 제어, 저장공간 확장
  'ㅅ': 'select',
  'ㅆ': 'move',
  'ㅈ': 'compare',
  'ㅊ': 'condition'
};

var CommandReverseMap = {};
Object.keys(CommandMap).forEach(function(k) {
  CommandReverseMap[CommandMap[k]] = k;
});

var LineMap = {
  ' ': 0,
  'ㄱ': 2,
  'ㄴ': 2,
  'ㄷ': 3,
  'ㄹ': 5,
  'ㅁ': 4,
  'ㅂ': 4,
  'ㅅ': 2,
  'ㅈ': 3,
  'ㅊ': 4,
  'ㅋ': 3,
  'ㅌ': 4,
  'ㅍ': 4,
  'ㄲ': 4,
  'ㄳ': 4,
  'ㄵ': 5,
  'ㄶ': 5,
  'ㄺ': 7,
  'ㄻ': 9,
  'ㄼ': 9,
  'ㄽ': 7,
  'ㄾ': 9,
  'ㄿ': 9,
  'ㅀ': 8,
  'ㅄ': 6,
  'ㅆ': 4
};

var LineReverseMap = {};
Object.keys(LineMap).forEach(function(k) {
  if(LineReverseMap[LineMap[k]] == null) {
    LineReverseMap[LineMap[k]] = '';
  }
  LineReverseMap[LineMap[k]] += k;
});

function isHangul(code) {
  return 0xAC00 <= code && code <= 0xD7A3;
}

function parseSyllable(char) {
  var data = {
    direction: 'none',
    command: 'none',
    original: char
  };
  var code = char.charCodeAt();
  // Validate input, Making sure it's a Hangul character
  if (!isHangul(code)) return data;
  // Extract consonants and vowel from the character
  code -= Hangul.code;
  var finalCode = code % Hangul.final.length;
  var final = Hangul.final[finalCode];
  code = code / Hangul.final.length | 0;
  var medialCode = code % Hangul.medial.length;
  var medial = Hangul.medial[medialCode];
  code = code / Hangul.medial.length | 0;
  var initialCode = code % Hangul.initial.length;
  var initial = Hangul.initial[initialCode];
  // Parse direction and type
  data.direction = DirectionMap[medial] || data.direction;
  data.command = CommandMap[initial] || data.command;
  // Handle special types
  if (data.command == 'push') {
    if (final == 'ㅇ') data.command = 'push-number';
    else if (final == 'ㅎ') data.command = 'push-unicode';
    else data.data = LineMap[final];
  }
  if (data.command == 'pop') {
    if (final == 'ㅇ') data.command = 'pop-number';
    else if (final == 'ㅎ') data.command = 'pop-unicode';
  }
  if (data.command == 'select' || data.command == 'move') {
    data.data = finalCode;
  }
  return data;
}

function encodeSyllable(data) {
  var initial = getRandomChar(CommandReverseMap[data.command]||'');
  var medial = getRandomChar(DirectionReverseMap[data.direction]);
  var final = ' ';
  if (data.command == 'push-number') {
    initial = 'ㅂ';
    final = 'ㅇ';
  } else if (data.command == 'push-unicode') {
    initial = 'ㅂ';
    final = 'ㅎ';
  } else if (data.command == 'push') {
    final = getRandomChar(LineReverseMap[data.data || 0]);
  } else if (data.command == 'pop-number') {
    initial = 'ㅁ';
    final = 'ㅇ';
  } else if (data.command == 'pop-unicode') {
    initial = 'ㅁ';
    final = 'ㅎ';
  } else if (data.command == 'select' || data.command == 'move') {
    final = getRandomChar(Hangul.final[data.data || 0]);
  }
  var initialCode = Hangul.initial.indexOf(initial);
  var medialCode = Hangul.medial.indexOf(medial);
  var finalCode = Hangul.final.indexOf(final);
  var code = Hangul.code;
  code += initialCode * Hangul.medial.length * Hangul.final.length;
  code += medialCode * Hangul.final.length;
  code += finalCode;
  return String.fromCharCode(code);
}

function encode(map) {
  var code = "";
  for (var y = 0; y < map.height; ++y) {
    var currentWidth = 0;
    for (var x = 0; x < map.width; ++x) {
      var tile = map.get(x, y);
      if(tile == null) continue;
      if(tile.direction == 'none' && tile.command == 'none') continue;;
      currentWidth = x + 1;
    }
    for (var x = 0; x < currentWidth; ++x) {
      var tile = map.get(x, y);
      if (tile) code += tile.original;
      else code += 'ㅇ';
    }
    code += '\n';
  }
  return code.slice(0, -1);
}

function getRandomChar(n) {
  return n.charAt(n.length * Math.random() | 0);
}

function parse(data) {
  var lines = data.split('\n');
  var map = new TileMap(0, lines.length);
  for (var y = 0; y < lines.length; ++y) {
    var line = lines[y].split('');
    map.expand(line.length, 0);
    for (var x = 0; x < line.length; ++x) {
      map.set(x, y, parseSyllable(line[x]));
    }
  }
  return map;
}

module.exports.parseSyllable = parseSyllable;
module.exports.parse = parse;
module.exports.encodeSyllable = encodeSyllable;
module.exports.encode = encode;

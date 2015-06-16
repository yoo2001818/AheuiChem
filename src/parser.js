var Hangul = {
  initial: 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'.split(''),
  medial: 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'.split(''),
  final: ' ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'.split(''),
  code: 0xAC00
};

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
  'ㅢ': 'reverse'
}

var CommandMap = {
  // ㅇ 묶음
  'ㅇ': 'none',
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

function isHangul(code) {
  return 0xAC00 <= code && code <= 0xD7A3;
}

function parseSyllable(char) {
  var data = {
    direction: 'none',
    command: 'none'
  };
  var code = char.charCodeAt();
  // Validate input, Making sure it's a Hangul character
  if(!isHangul(code)) return data;
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
  if(data.command == 'push') {
    if(final == 'ㅇ') data.command = 'push-number';
    else if(final == 'ㅎ') data.command = 'push-unicode';
    else data.data = LineMap[final];
  }
  if(data.command == 'pop') {
    if(final == 'ㅇ') data.command = 'pop-number';
    else if(final == 'ㅎ') data.command = 'pop-unicode';
  }
  if(data.command == 'select' || data.command == 'move') {
    data.data = finalCode;
  }
  return data;
}

module.exports.parseSyllable = parseSyllable;

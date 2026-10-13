/* Additional search keys, never replacements for original Unicode text.
   Brahmic block offsets follow Unicode charts; transliteration is mechanical,
   not translation and not evidence for a religious identity relationship. */
const consonants = {
  21: 'k', 22: 'kh', 23: 'g', 24: 'gh', 25: 'ng', 26: 'ch', 27: 'chh', 28: 'j', 29: 'jh', 30: 'ny',
  31: 't', 32: 'th', 33: 'd', 34: 'dh', 35: 'n', 36: 't', 37: 'th', 38: 'd', 39: 'dh', 40: 'n',
  41: 'n', 42: 'p', 43: 'ph', 44: 'b', 45: 'bh', 46: 'm', 47: 'y', 48: 'r', 49: 'r', 50: 'l',
  51: 'l', 52: 'l', 53: 'v', 54: 'sh', 55: 'sh', 56: 's', 57: 'h',
};
const vowels = { 5: 'a', 6: 'aa', 7: 'i', 8: 'ii', 9: 'u', 10: 'uu', 11: 'ri', 12: 'li', 15: 'e', 16: 'ai', 19: 'o', 20: 'au' };
const marks = { 62: 'aa', 63: 'i', 64: 'ii', 65: 'u', 66: 'uu', 67: 'ri', 68: 'rii', 71: 'e', 72: 'ai', 75: 'o', 76: 'au' };
const bases = [0x0900, 0x0980, 0x0a00, 0x0a80, 0x0b00, 0x0c00, 0x0c80, 0x0d00];
const tamilConsonants = { 'க': 'k', 'ங': 'ng', 'ச': 'ch', 'ஞ': 'ny', 'ட': 't', 'ண': 'n', 'த': 't', 'ந': 'n', 'ப': 'p', 'ம': 'm', 'ய': 'y', 'ர': 'r', 'ல': 'l', 'வ': 'v', 'ழ': 'zh', 'ள': 'l', 'ற': 'r', 'ன': 'n', 'ஜ': 'j', 'ஶ': 'sh', 'ஷ': 'sh', 'ஸ': 's', 'ஹ': 'h' };
const tamilVowels = { 'அ': 'a', 'ஆ': 'aa', 'இ': 'i', 'ஈ': 'ii', 'உ': 'u', 'ஊ': 'uu', 'எ': 'e', 'ஏ': 'e', 'ஐ': 'ai', 'ஒ': 'o', 'ஓ': 'o', 'ஔ': 'au' };
const tamilMarks = { 'ா': 'aa', 'ி': 'i', 'ீ': 'ii', 'ு': 'u', 'ூ': 'uu', 'ெ': 'e', 'ே': 'e', 'ை': 'ai', 'ொ': 'o', 'ோ': 'o', 'ௌ': 'au', '்': '' };
export function romanizeIndic(value) {
  let output = '', pending = false;
  for (const char of String(value).normalize('NFC')) {
    const code = char.codePointAt(0), base = bases.find(b => code >= b && code < b + 128);
    const offset = base === undefined ? -1 : code - base;
    if (tamilConsonants[char]) { output += tamilConsonants[char] + 'a'; pending = true; }
    else if (Object.hasOwn(tamilMarks, char)) {
      if (pending && output.endsWith('a')) output = output.slice(0, -1);
      output += tamilMarks[char]; pending = false;
    } else if (consonants[offset]) { output += consonants[offset] + 'a'; pending = true; }
    else if (marks[offset] || offset === 77) {
      if (pending && output.endsWith('a')) output = output.slice(0, -1);
      output += marks[offset] || ''; pending = false;
    } else { output += tamilVowels[char] || vowels[offset] || ({ 1: 'n', 2: 'm', 3: 'h' }[offset]) || char; pending = false; }
  }
  return output;
}
export function phoneticKey(value) {
  if (!/^[a-z ]{5,}$/i.test(value)) return '';
  return value.toLowerCase().replace(/ph/g, 'f').replace(/sh/g, 's').replace(/w/g, 'v')
    .replace(/([a-z])\1+/g, '$1').replace(/[aeiou]/g, '');
}

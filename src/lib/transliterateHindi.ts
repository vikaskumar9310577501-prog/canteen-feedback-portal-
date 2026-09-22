/**
 * Hindi Phonetic Transliteration Engine (Roman Hinglish -> Devanagari Hindi)
 * Converts words like "rahul" -> "राहुल", "sharma" -> "शर्मा", "namaste" -> "नमस्ते", "khana" -> "खाना"
 */

const VOWELS: Record<string, string> = {
  'a': 'अ', 'aa': 'आ', 'i': 'इ', 'ee': 'ई', 'u': 'उ', 'oo': 'ऊ',
  'e': 'ए', 'ai': 'ऐ', 'o': 'ओ', 'au': 'औ', 'ri': 'ऋ',
};

const MATRAS: Record<string, string> = {
  'aa': 'ा', 'i': 'ि', 'ee': 'ी', 'u': 'ु', 'oo': 'ू',
  'e': 'े', 'ai': 'ै', 'o': 'ो', 'au': 'ौ', 'ri': 'ृ',
};

const CONSONANTS: [string, string][] = [
  ['kh', 'ख'], ['gh', 'घ'], ['ch', 'च'], ['chh', 'छ'], ['jh', 'झ'],
  ['th', 'थ'], ['dh', 'ध'], ['ph', 'फ'], ['bh', 'भ'], ['sh', 'श'],
  ['shh', 'ष'], ['gy', 'ज्ञ'], ['tr', 'त्र'], ['ksh', 'क्ष'],
  ['k', 'क'], ['g', 'ग'], ['c', 'च'], ['j', 'ज'], ['t', 'त'],
  ['d', 'द'], ['n', 'न'], ['p', 'प'], ['b', 'ब'], ['m', 'म'],
  ['y', 'य'], ['r', 'र'], ['l', 'ल'], ['v', 'व'], ['w', 'व'],
  ['s', 'स'], ['h', 'ह'], ['f', 'फ़'], ['z', 'ज़'], ['q', 'क़'],
];

const COMMON_DICTIONARY: Record<string, string> = {
  'rahul': 'राहुल',
  'sharma': 'शर्मा',
  'amit': 'अमित',
  'patel': 'पटेल',
  'vikas': 'विकास',
  'singh': 'सिंह',
  'kumar': 'कुमार',
  'anita': 'अनीता',
  'verma': 'वर्मा',
  'rajesh': 'राजेश',
  'gupta': 'गुप्ता',
  'priya': 'प्रिया',
  'sandeep': 'संदीप',
  'sunita': 'सुनीता',
  'yadav': 'यादव',
  'mehra': 'मेहरा',
  'joshi': 'जोशी',
  'rao': 'राव',
  'khana': 'खाना',
  'accha': 'अच्छा',
  'acha': 'अच्छा',
  'bohot': 'बहुत',
  'bahut': 'बहुत',
  'swad': 'स्वाद',
  'swadish': 'स्वादिष्ट',
  'roti': 'रोटी',
  'paneer': 'पनीर',
  'dal': 'दाल',
  'chawal': 'चावल',
  'sabzi': 'सब्जी',
  'chai': 'चाय',
  'canteen': 'कैंटीन',
  'safai': 'सफाई',
  'namaste': 'नमस्ते',
  'dhanyawad': 'धन्यवाद',
  'shukriya': 'शुक्रिया',
};

/**
 * Transliterates a single English/Hinglish word to Devanagari Hindi
 */
export const transliterateWord = (word: string): string => {
  if (!word || word.trim().length === 0) return word;

  const clean = word.trim().toLowerCase();

  // Check Dictionary first
  if (COMMON_DICTIONARY[clean]) {
    return COMMON_DICTIONARY[clean];
  }

  // Basic Rule Parser
  let res = '';
  let i = 0;
  const len = clean.length;

  while (i < len) {
    let matched = false;

    // Try multi-char consonant matches
    for (const [eng, dev] of CONSONANTS) {
      if (clean.substring(i, i + eng.length) === eng) {
        res += dev;
        i += eng.length;
        matched = true;
        break;
      }
    }

    if (!matched) {
      const char = clean[i];
      if (char >= 'a' && char <= 'z') {
        if (i === 0 && VOWELS[char]) {
          res += VOWELS[char];
        } else if (MATRAS[char]) {
          res += MATRAS[char];
        } else {
          res += char;
        }
      } else {
        res += char;
      }
      i++;
    }
  }

  return res;
};

/**
 * Transliterates a full sentence / string input
 */
export const transliterateHindiSentence = (input: string): string => {
  if (!input) return '';

  // Preserve trailing space or current typing
  const words = input.split(/(\s+)/);
  return words
    .map((w) => {
      if (/^\s+$/.test(w) || !w) return w;
      // Do not transliterate numbers, emails, or IDs (e.g. EMP-10492 or email@domain.com)
      if (w.includes('@') || w.includes('.') || /\d/.test(w) || w.startsWith('EMP')) {
        return w;
      }
      return transliterateWord(w);
    })
    .join('');
};

/**
 * Online Google Transliteration API wrapper with automatic offline fallback
 */
export const fetchGoogleTransliteration = async (text: string): Promise<string> => {
  if (!text || text.trim().length === 0) return text;
  
  // Do not transliterate numbers, emails, or IDs
  if (text.includes('@') || text.includes('.') || /^\d+$/.test(text) || text.startsWith('EMP')) {
    return text;
  }

  try {
    const url = `https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=hi-t-i0-und&num=1`;
    const res = await fetch(url);
    const data = await res.json();
    if (data && data[0] === 'SUCCESS' && data[1] && data[1][0] && data[1][0][1] && data[1][0][1][0]) {
      return data[1][0][1][0];
    }
  } catch (err) {
    // Silent fallback to local rule-based engine
  }

  return transliterateHindiSentence(text);
};

import { PronounProfile, PronounMode } from '../../types';

export const DEFAULT_CONVERT_PRONOUNS: Record<string, string> = {
  '我': 'ta',
  '你': 'ngươi',
  '您': 'ngài',
  '他': 'hắn',
  '她': 'nàng',
  '它': 'nó',
  '我们': 'chúng ta',
  '你们': 'các ngươi',
  '他们': 'bọn hắn',
  '她们': 'bọn nàng',
  '本座': 'bản tọa',
  '老夫': 'lão phu',
  '晚辈': 'vãn bối',
  '前辈': 'tiền bối',
  '师尊': 'sư tôn',
  '师兄': 'sư huynh',
  '师弟': 'sư đệ',
  '师姐': 'sư tỷ',
  '师妹': 'sư muội',
  '掌门': 'chưởng môn',
  '宗主': 'tông chủ',
  '长老': 'trưởng lão',
  '道友': 'đạo hữu',
  '阁下': 'các hạ',
  '在下': 'tại hạ',
};

export const DEFAULT_NATURAL_PRONOUNS: Record<string, string> = {
  '我': 'tôi / mình / anh / em',
  '你': 'cậu / bạn / anh / em',
  '您': 'bác / chú / ngài',
  '他': 'anh ấy / cậu ấy / hắn',
  '她': 'cô ấy / nàng / chị ấy',
  '它': 'nó',
  '我们': 'chúng tôi / chúng mình',
  '你们': 'các bạn / các cậu',
  '他们': 'họ / bọn họ',
  '她们': 'các cô ấy',
};

export const DEFAULT_PRONOUN_PROFILE: PronounProfile = {
  mode: 'hybrid',
  lexicalRules: { ...DEFAULT_CONVERT_PRONOUNS },
  narrationRules: {
    'third_person_male': 'hắn',
    'third_person_female': 'nàng',
    'third_person_neutral': 'y / gã',
  },
  addressingPolicy: 'contextual',
};

export function parsePronounsText(text: string): Record<string, string> {
  if (!text || !text.trim()) return {};
  const rules: Record<string, string> = {};
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;

    let sepIndex = trimmed.indexOf('=');
    let sepLen = 1;
    if (sepIndex === -1) {
      sepIndex = trimmed.indexOf('->');
      sepLen = 2;
    }
    if (sepIndex === -1) {
      sepIndex = trimmed.indexOf(':');
      sepLen = 1;
    }
    if (sepIndex === -1) {
      sepIndex = trimmed.indexOf('\t');
      sepLen = 1;
    }

    if (sepIndex > 0) {
      const ch = trimmed.substring(0, sepIndex).trim();
      const vi = trimmed.substring(sepIndex + sepLen).trim();
      if (ch && vi) {
        rules[ch] = vi;
      }
    }
  }

  return rules;
}

export function filterPronounsForBatch(
  profile: PronounProfile,
  rawBatchText: string
): Record<string, string> {
  if (!rawBatchText || !profile.lexicalRules) return {};
  const active: Record<string, string> = {};
  for (const [ch, vi] of Object.entries(profile.lexicalRules)) {
    if (rawBatchText.includes(ch)) {
      active[ch] = vi;
    }
  }
  return active;
}

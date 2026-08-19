import { CharacterAddressingContext, CharacterAddressingEntry } from '../../types';

export const INITIAL_CHARACTER_CONTEXT: CharacterAddressingContext = {
  characters: [],
};

export function filterCharacterAddressingForBatch(
  context: CharacterAddressingContext,
  rawBatchText: string
): CharacterAddressingEntry[] {
  if (!context || !context.characters || !rawBatchText) return [];

  return context.characters.filter(char => {
    if (rawBatchText.includes(char.canonicalChinese)) return true;
    if (char.aliases && char.aliases.some(alias => rawBatchText.includes(alias))) return true;
    return false;
  });
}

export interface CharacterDeltaPayload {
  new_characters?: {
    canonical_chinese: string;
    canonical_vietnamese: string;
    aliases?: string[];
    gender?: 'male' | 'female' | 'other';
    confidence: number;
    evidence?: string;
  }[];
  relationships?: {
    source_chinese: string;
    target_chinese: string;
    role: string;
    source_self_addressing: string;
    source_other_addressing: string;
    confidence: number;
    evidence?: string;
  }[];
}

/**
 * Merges AI-extracted delta deterministically into canonical CharacterAddressingContext.
 */
export function mergeCharacterAddressingDelta(
  current: CharacterAddressingContext,
  delta: CharacterDeltaPayload,
  minConfidence: number = 0.8
): CharacterAddressingContext {
  const characters = [...(current.characters || [])];

  // 1. Process new characters & aliases
  if (delta.new_characters && Array.isArray(delta.new_characters)) {
    for (const item of delta.new_characters) {
      if ((item.confidence || 0) < minConfidence || !item.canonical_chinese) continue;

      const existingIndex = characters.findIndex(c => 
        c.canonicalChinese === item.canonical_chinese ||
        (c.aliases && c.aliases.includes(item.canonical_chinese))
      );

      if (existingIndex >= 0) {
        // Merge aliases into existing character
        const existing = characters[existingIndex];
        const currentAliases = existing.aliases || [];
        const newAliases = (item.aliases || []).filter(a => a && !currentAliases.includes(a) && a !== existing.canonicalChinese);
        characters[existingIndex] = {
          ...existing,
          aliases: [...currentAliases, ...newAliases],
          gender: existing.gender || item.gender,
        };
      } else {
        // Add new character
        characters.push({
          id: `char-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          canonicalChinese: item.canonical_chinese,
          canonicalVietnamese: item.canonical_vietnamese || item.canonical_chinese,
          aliases: (item.aliases || []).filter(Boolean),
          gender: item.gender,
          relationships: {},
          confidence: item.confidence,
        });
      }
    }
  }

  // 2. Process relationships
  if (delta.relationships && Array.isArray(delta.relationships)) {
    for (const rel of delta.relationships) {
      if ((rel.confidence || 0) < minConfidence || !rel.source_chinese || !rel.target_chinese) continue;

      const sourceChar = characters.find(c => c.canonicalChinese === rel.source_chinese || (c.aliases && c.aliases.includes(rel.source_chinese)));
      if (sourceChar) {
        sourceChar.relationships = sourceChar.relationships || {};
        sourceChar.relationships[rel.target_chinese] = {
          role: rel.role || 'quen biết',
          selfAddressing: rel.source_self_addressing || 'tôi',
          otherAddressing: rel.source_other_addressing || 'cậu',
        };
      }
    }
  }

  return { characters };
}

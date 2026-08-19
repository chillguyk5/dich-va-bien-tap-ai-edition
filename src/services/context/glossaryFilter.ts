/**
 * Dynamic Glossary Filter
 * Filters canonical user glossary to only include terms present in the current raw text batch.
 */

export interface ParsedGlossaryEntry {
  raw: string;
  vietnamese: string;
  category?: string;
}

export function parseGlossary(glossaryText: string): ParsedGlossaryEntry[] {
  if (!glossaryText || !glossaryText.trim()) return [];

  const lines = glossaryText.split(/\r?\n/);
  const entries: ParsedGlossaryEntry[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;

    // Support formats: "raw = vietnamese" or "raw: vietnamese" or "raw -> vietnamese" or "raw\tvietnamese"
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
      const raw = trimmed.substring(0, sepIndex).trim();
      const vietnamese = trimmed.substring(sepIndex + sepLen).trim();
      if (raw && vietnamese) {
        entries.push({ raw, vietnamese });
      }
    }
  }

  return entries;
}

export function filterGlossaryForBatch(
  glossaryText: string | ParsedGlossaryEntry[],
  rawBatchText: string
): Record<string, string> {
  const entries = typeof glossaryText === 'string' ? parseGlossary(glossaryText) : glossaryText;
  if (!entries.length || !rawBatchText) return {};

  const activeGlossary: Record<string, string> = {};

  for (const entry of entries) {
    if (rawBatchText.includes(entry.raw)) {
      activeGlossary[entry.raw] = entry.vietnamese;
    }
  }

  return activeGlossary;
}

export function formatActiveGlossary(activeGlossary: Record<string, string>): string {
  return Object.entries(activeGlossary)
    .map(([raw, vi]) => `${raw} = ${vi}`)
    .join('\n');
}

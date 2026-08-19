import { FileItem } from '../../types';

export interface StructuralValidationResult {
  isValid: boolean;
  parsedChapters: Map<string, string>; // fileId -> translated content
  missingIds: string[];
  corruptedIds: string[];
  errorMessage?: string;
}

/**
 * Packages multiple chapter files into machine-readable XML tags for the Translator.
 */
export function packageChaptersToXml(files: FileItem[]): string {
  return files.map(file => {
    return `<chapter id="${file.id}">\n${file.content.trim()}\n</chapter>`;
  }).join('\n\n');
}

/**
 * Validates translated output and extracts individual chapter contents by ID.
 */
export function validateAndExtractChapters(
  outputXml: string,
  expectedFileIds: string[]
): StructuralValidationResult {
  const parsedChapters = new Map<string, string>();
  const missingIds: string[] = [];
  const corruptedIds: string[] = [];

  // Match all <chapter id="...">...</chapter> tags (supports single/double quotes with spaces, or unquoted ids)
  const regex = /<chapter\s+id=(?:"([^"]+)"|'([^']+)'|([^\s>]+))>([\s\S]*?)<\/chapter>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(outputXml)) !== null) {
    const rawId = (match[1] || match[2] || match[3] || '').trim();
    const content = (match[4] || '').trim();

    // Map matched ID to expected ID (handling case sensitivity or whitespace)
    const matchedExpected = expectedFileIds.find(id => id.toLowerCase() === rawId.toLowerCase());
    if (matchedExpected) {
      if (!content || content.length < 20) {
        corruptedIds.push(matchedExpected);
      } else {
        parsedChapters.set(matchedExpected, content);
      }
    } else {
      // Unrecognized ID in output
      console.warn(`Unrecognized chapter id in output: ${rawId}`);
    }
  }

  // If standard tag extraction failed completely, check if it's a single chapter request
  if (parsedChapters.size === 0 && expectedFileIds.length === 1) {
    const cleaned = outputXml.replace(/<\/?chapter[^>]*>/gi, '').trim();
    if (cleaned.length > 50) {
      parsedChapters.set(expectedFileIds[0], cleaned);
    }
  }

  // Check for any expected file ID that was not parsed
  for (const expectedId of expectedFileIds) {
    if (!parsedChapters.has(expectedId)) {
      missingIds.push(expectedId);
    }
  }

  const isValid = missingIds.length === 0 && corruptedIds.length === 0 && parsedChapters.size === expectedFileIds.length;

  let errorMessage: string | undefined;
  if (!isValid) {
    const errorDetails: string[] = [];
    if (missingIds.length > 0) errorDetails.push(`Mất thẻ chương ID: [${missingIds.join(', ')}]`);
    if (corruptedIds.length > 0) errorDetails.push(`Nội dung rỗng/lỗi ID: [${corruptedIds.join(', ')}]`);
    errorMessage = `Lỗi cấu trúc batch: ${errorDetails.join('; ')}`;
  }

  return {
    isValid,
    parsedChapters,
    missingIds,
    corruptedIds,
    errorMessage,
  };
}

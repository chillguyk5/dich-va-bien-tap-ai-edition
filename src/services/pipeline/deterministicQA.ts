import { parseGlossary } from '../context/glossaryFilter';
import { executeTaskInference } from '../inference/providerManager';

export interface QACheckResult {
  isValid: boolean;
  issues: string[];
  cleanedText: string;
  residueChineseCount: number;
  hasDuplicates: boolean;
  hasLengthAnomaly: boolean;
}

export const CHINESE_CHAR_REGEX = /[\u4e00-\u9fa5]/g;

/**
 * Deterministic code-first QA scanner.
 */
export function runDeterministicQA(
  rawText: string,
  vietnameseText: string,
  glossaryText?: string
): QACheckResult {
  const issues: string[] = [];
  let cleanedText = vietnameseText || '';

  // 1. Chinese character scan
  const chineseMatches = cleanedText.match(CHINESE_CHAR_REGEX) || [];
  let residueChineseCount = chineseMatches.length;

  // Attempt deterministic Fix Chinese using verified glossary first
  if (residueChineseCount > 0 && glossaryText) {
    const glossary = parseGlossary(glossaryText);
    for (const entry of glossary) {
      if (cleanedText.includes(entry.raw)) {
        cleanedText = cleanedText.split(entry.raw).join(entry.vietnamese);
      }
    }
    const remainingMatches = cleanedText.match(CHINESE_CHAR_REGEX) || [];
    residueChineseCount = remainingMatches.length;
  }

  if (residueChineseCount > 0) {
    issues.push(`Còn sót ${residueChineseCount} ký tự chữ Hán chưa dịch.`);
  }

  // 2. Duplicate paragraph / sentence check
  const paragraphs = cleanedText.split(/\r?\n/).map(p => p.trim()).filter(p => p.length > 20);
  const paraSet = new Set<string>();
  let hasDuplicates = false;

  for (const p of paragraphs) {
    if (paraSet.has(p)) {
      hasDuplicates = true;
      break;
    }
    paraSet.add(p);
  }

  if (hasDuplicates) {
    issues.push('Phát hiện đoạn văn bị trùng lặp lặp đi lặp lại.');
  }

  // 3. Length anomaly check
  let hasLengthAnomaly = false;
  if (rawText && rawText.length > 200) {
    const ratio = cleanedText.length / rawText.length;
    // Chinese to Vietnamese length ratio is typically 1.2 to 2.5
    if (ratio < 0.4) {
      hasLengthAnomaly = true;
      issues.push(`Bản dịch quá ngắn bất thường (tỷ lệ độ dài ${ratio.toFixed(2)} so với bản gốc).`);
    } else if (ratio > 5.0) {
      hasLengthAnomaly = true;
      issues.push(`Bản dịch dài bất thường / có thể bị lặp vô tận (tỷ lệ độ dài ${ratio.toFixed(2)}).`);
    }
  }

  const isValid = issues.length === 0;

  return {
    isValid,
    issues,
    cleanedText,
    residueChineseCount,
    hasDuplicates,
    hasLengthAnomaly,
  };
}

/**
 * Targeted repair with Lite/Flash model for isolated lines with Chinese characters.
 */
export async function repairTargetedLines(
  fullText: string,
  glossary?: string
): Promise<string> {
  const lines = fullText.split(/\r?\n/);
  const problematicIndices: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (CHINESE_CHAR_REGEX.test(lines[i])) {
      problematicIndices.push(i);
    }
  }

  if (problematicIndices.length === 0) return fullText;

  // Build snippet of problematic lines with line numbers
  const linesToFix = problematicIndices.map(idx => `[DÒNG ${idx + 1}] ${lines[idx]}`).join('\n');

  const systemPrompt = `BẠN LÀ MỘT CÔNG CỤ SỬA LỖI SÓT HÁN TỰ TIỂU THUYẾT.
Hãy dịch các từ/ký tự tiếng Trung còn sót lại trong các dòng được cung cấp sang tiếng Việt mượt mà, giữ nguyên ngữ cảnh của câu.
BẮT BUỘC: Giữ đúng định dạng [DÒNG X] [Nội dung dòng đã sửa]. Không thêm giải thích.`;

  const userPrompt = `${glossary ? `[TỪ ĐIỂN THAM KHẢO]\n${glossary}\n\n` : ''}[CÁC DÒNG CẦN SỬA]\n${linesToFix}`;

  try {
    const result = await executeTaskInference('qa_repair', systemPrompt, userPrompt);
    const resultLines = result.text.split(/\r?\n/);

    for (const rLine of resultLines) {
      const match = rLine.match(/^\[DÒNG\s+(\d+)\]\s*(.*)$/i);
      if (match) {
        const lineNum = parseInt(match[1], 10) - 1;
        const fixedContent = match[2];
        if (lineNum >= 0 && lineNum < lines.length && fixedContent.trim()) {
          lines[lineNum] = fixedContent;
        }
      }
    }

    return lines.join('\n');
  } catch (e) {
    console.warn('Targeted line repair failed', e);
    return fullText;
  }
}

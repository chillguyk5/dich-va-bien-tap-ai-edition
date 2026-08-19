import { FileItem, BookStyleProfile, EditorRawMode, FewShotExample } from '../../types';
import { buildEditorSystemPrompt, buildEditorUserPrompt } from '../../prompts/editorPrompt';
import { retrieveFewShotsForTask, detectSceneTags } from '../context/fewShotRetriever';
import { executeTaskInference, InferenceOptions } from '../inference/providerManager';

export interface EditorStepContext {
  bookStyle?: BookStyleProfile;
  rawMode?: EditorRawMode;
  fewShotPool?: FewShotExample[];
  contextLines?: number;
}

export interface EditorStepResult {
  success: boolean;
  editedContent: string;
  usedModel: string;
  durationMs: number;
  error?: string;
}

/**
 * Extracts source snippets for reported issues with ±1-2 surrounding sentences.
 */
function buildHybridSnippets(
  rawText: string,
  draftText: string,
  issues: any[] = [],
  contextLines: number = 2
) {
  if (!issues || issues.length === 0 || !rawText) return [];

  const rawLines = rawText.split('\n');
  const draftLines = draftText.split('\n');
  const snippets: any[] = [];

  for (const issue of issues) {
    const rawSpan = issue.sourceSpan?.trim();
    const draftSpan = issue.translationSpan?.trim();

    if (!rawSpan && !draftSpan) continue;

    // Find line in raw text
    let rawLineIndex = -1;
    if (rawSpan) {
      rawLineIndex = rawLines.findIndex(l => l.includes(rawSpan));
    }

    let beforeContext = '';
    let afterContext = '';

    if (rawLineIndex >= 0) {
      const start = Math.max(0, rawLineIndex - contextLines);
      const end = Math.min(rawLines.length, rawLineIndex + contextLines + 1);
      beforeContext = rawLines.slice(start, rawLineIndex).join(' ').trim();
      afterContext = rawLines.slice(rawLineIndex + 1, end).join(' ').trim();
    }

    snippets.push({
      issueId: issue.issueId || 'issue',
      sourceSnippet: rawSpan || '(đối chiếu ngữ cảnh)',
      draftSnippet: draftSpan || '',
      contextBefore: beforeContext || undefined,
      contextAfter: afterContext || undefined,
    });
  }

  return snippets;
}

export async function executeEditorSingleChapter(
  file: FileItem,
  context: EditorStepContext = {},
  options: InferenceOptions = {}
): Promise<EditorStepResult> {
  const draftText = file.draftTranslation || file.translatedContent || '';
  if (!draftText.trim()) {
    return {
      success: false,
      editedContent: '',
      usedModel: 'none',
      durationMs: 0,
      error: 'Không tìm thấy bản dịch thô (draft) để biên tập.',
    };
  }

  const rawMode: EditorRawMode = context.rawMode || 'hybrid';
  const detectedTags = detectSceneTags(draftText);
  const matchedFewShots = context.fewShotPool 
    ? retrieveFewShotsForTask(context.fewShotPool, detectedTags, 2)
    : [];

  const hybridSnippets = rawMode === 'hybrid'
    ? buildHybridSnippets(file.content, draftText, file.reviewReport?.issues, context.contextLines || 2)
    : undefined;

  // 1. Build prompts
  const promptParams = {
    chapterId: file.id,
    draftText,
    reviewReport: file.reviewReport,
    rawMode,
    rawSourceText: rawMode === 'full_raw' ? file.content : undefined,
    hybridSourceSnippets: hybridSnippets,
    bookStyle: context.bookStyle,
    fewShots: matchedFewShots,
  };

  const systemPrompt = buildEditorSystemPrompt(promptParams);
  const userPrompt = buildEditorUserPrompt(promptParams);

  // 2. Execute inference
  const inference = await executeTaskInference(
    'edit',
    systemPrompt,
    userPrompt,
    {
      ...options,
      taskName: `Biên Tập (${file.name})`,
    }
  );

  const editedContent = inference.text.trim();
  if (!editedContent || editedContent.length < 50) {
    return {
      success: false,
      editedContent: '',
      usedModel: inference.usedModel,
      durationMs: inference.durationMs,
      error: 'Bản biên tập trả về rỗng hoặc quá ngắn.',
    };
  }

  return {
    success: true,
    editedContent,
    usedModel: inference.usedModel,
    durationMs: inference.durationMs,
  };
}

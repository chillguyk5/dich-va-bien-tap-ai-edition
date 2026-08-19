import { FileItem, BookStyleProfile, PronounProfile, CharacterAddressingContext, StoryInfo } from '../../types';
import { buildTranslatorSystemPrompt, buildTranslatorUserPrompt } from '../../prompts/translatorPrompt';
import { filterGlossaryForBatch } from '../context/glossaryFilter';
import { filterPronounsForBatch } from '../context/pronounResolver';
import { filterCharacterAddressingForBatch } from '../context/characterAddressingManager';
import { packageChaptersToXml, validateAndExtractChapters } from './structuralValidator';
import { executeTaskInference, InferenceOptions } from '../inference/providerManager';

export interface TranslatorStepContext {
  glossary?: string;
  pronounProfile?: PronounProfile;
  bookStyle?: BookStyleProfile;
  characterAddressing?: CharacterAddressingContext;
  storyInfo?: StoryInfo;
  previousBatchContext?: string;
}

export interface TranslatorStepResult {
  success: boolean;
  results: Map<string, string>; // fileId -> draftTranslation
  usedModel: string;
  durationMs: number;
  error?: string;
}

export async function executeTranslatorBatch(
  batchFiles: FileItem[],
  context: TranslatorStepContext,
  options: InferenceOptions = {}
): Promise<TranslatorStepResult> {
  if (!batchFiles || batchFiles.length === 0) {
    return { success: true, results: new Map(), usedModel: 'none', durationMs: 0 };
  }

  const combinedRaw = batchFiles.map(f => f.content).join('\n');

  // 1. Dynamic filtering of context for this specific batch
  const activeGlossary = context.glossary 
    ? filterGlossaryForBatch(context.glossary, combinedRaw)
    : {};

  const activePronouns = context.pronounProfile 
    ? filterPronounsForBatch(context.pronounProfile, combinedRaw)
    : {};

  const activeAddressing = context.characterAddressing
    ? filterCharacterAddressingForBatch(context.characterAddressing, combinedRaw)
    : [];

  // 2. Build system and user prompts
  const systemPrompt = buildTranslatorSystemPrompt({
    bookStyle: context.bookStyle,
    pronounProfile: context.pronounProfile,
    storyInfo: context.storyInfo,
  });

  const rawXml = packageChaptersToXml(batchFiles);
  const userPrompt = buildTranslatorUserPrompt(rawXml, {
    activeGlossary,
    pronounProfile: context.pronounProfile ? { ...context.pronounProfile, lexicalRules: activePronouns } : undefined,
    activeAddressing,
    previousContext: context.previousBatchContext,
  });

  // 3. Execute inference
  const expectedFileIds = batchFiles.map(f => f.id);
  const inference = await executeTaskInference(
    'translate',
    systemPrompt,
    userPrompt,
    {
      ...options,
      taskName: `Dịch Batch (${batchFiles.length} chương / ~${Math.round(combinedRaw.length / 1000)}k chữ)`,
    }
  );

  // 4. Validate structural output (chapter boundaries & IDs)
  const validation = validateAndExtractChapters(inference.text, expectedFileIds);

  if (!validation.isValid) {
    // If multiple chapters in batch failed, we can return the error so the caller can retry selectively
    return {
      success: false,
      results: validation.parsedChapters,
      usedModel: inference.usedModel,
      durationMs: inference.durationMs,
      error: validation.errorMessage || 'Lỗi cấu trúc thẻ chương trong bản dịch.',
    };
  }

  return {
    success: true,
    results: validation.parsedChapters,
    usedModel: inference.usedModel,
    durationMs: inference.durationMs,
  };
}

import { FileItem, ChapterReviewReport, BookStyleProfile } from '../../types';
import { buildReviewerSystemPrompt, buildReviewerUserPrompt } from '../../prompts/reviewerPrompt';
import { executeTaskInference, InferenceOptions } from '../inference/providerManager';

export interface ReviewerStepContext {
  bookStyle?: BookStyleProfile;
  glossary?: string;
}

export interface ReviewerStepResult {
  success: boolean;
  reports: Map<string, ChapterReviewReport>; // fileId -> ChapterReviewReport
  usedModel: string;
  durationMs: number;
  globalObservations?: string[];
  error?: string;
}

export async function executeReviewerBatch(
  batchFiles: FileItem[],
  context: ReviewerStepContext = {},
  options: InferenceOptions = {}
): Promise<ReviewerStepResult> {
  const eligibleFiles = batchFiles.filter(f => f.draftTranslation && f.draftTranslation.trim().length > 0);
  if (eligibleFiles.length === 0) {
    return { success: true, reports: new Map(), usedModel: 'none', durationMs: 0 };
  }

  // 1. Build prompts
  const systemPrompt = buildReviewerSystemPrompt(context.bookStyle);
  const chaptersPayload = eligibleFiles.map(f => ({
    id: f.id,
    raw: f.content,
    draft: f.draftTranslation!,
  }));

  const userPrompt = buildReviewerUserPrompt(chaptersPayload, context.glossary);

  // 2. Execute inference in JSON mode
  const inference = await executeTaskInference(
    'review',
    systemPrompt,
    userPrompt,
    {
      ...options,
      jsonOutput: true,
      taskName: `Thẩm Định Beta (${eligibleFiles.length} chương)`,
    }
  );

  // 3. Parse JSON response
  const reports = new Map<string, ChapterReviewReport>();
  let globalObservations: string[] = [];

  try {
    // Extract JSON block if surrounded by markdown fences
    let jsonStr = inference.text.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    }

    const parsed = JSON.parse(jsonStr);
    if (parsed.chapters && Array.isArray(parsed.chapters)) {
      for (const ch of parsed.chapters) {
        if (ch.chapter_id) {
          const matchedFile = eligibleFiles.find(f => f.id.toLowerCase() === String(ch.chapter_id).toLowerCase());
          const targetId = matchedFile ? matchedFile.id : ch.chapter_id;

          const report: ChapterReviewReport = {
            chapterId: targetId,
            score: typeof ch.score === 'number' ? ch.score : 8.0,
            confidence: typeof ch.confidence === 'number' ? ch.confidence : 0.9,
            action: ch.action === 'pass' || ch.action === 'retranslate' ? ch.action : 'edit',
            summary: ch.summary || '',
            issues: (ch.issues || []).map((iss: any, idx: number) => ({
              issueId: iss.issue_id || `${targetId}-${idx + 1}`,
              type: iss.type || 'mistranslation',
              severity: iss.severity || 'minor',
              sourceSpan: iss.source_span || '',
              translationSpan: iss.translation_span || '',
              explanation: iss.explanation || '',
              suggestedFix: iss.suggested_fix || '',
              confidence: typeof iss.confidence === 'number' ? iss.confidence : 0.9,
            })),
          };

          reports.set(targetId, report);
        }
      }
    }

    if (parsed.global_observations && Array.isArray(parsed.global_observations)) {
      globalObservations = parsed.global_observations;
    }
  } catch (err: any) {
    console.error('Failed to parse reviewer JSON report', err, inference.text);
    return {
      success: false,
      reports: new Map(),
      usedModel: inference.usedModel,
      durationMs: inference.durationMs,
      error: `Lỗi đọc cấu trúc báo cáo Reviewer: ${err.message}`,
    };
  }

  // Ensure every file in batch gets at least a default report if model missed one
  for (const file of eligibleFiles) {
    if (!reports.has(file.id)) {
      reports.set(file.id, {
        chapterId: file.id,
        score: 8.5,
        confidence: 0.8,
        action: 'edit',
        summary: 'Đã hoàn thành thẩm định mặc định.',
        issues: [],
      });
    }
  }

  return {
    success: true,
    reports,
    usedModel: inference.usedModel,
    durationMs: inference.durationMs,
    globalObservations,
  };
}

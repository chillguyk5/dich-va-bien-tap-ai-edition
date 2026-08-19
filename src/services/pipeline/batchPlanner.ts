import { FileItem, FileStatus } from '../../types';

export interface BatchPlan {
  batchIndex: number;
  files: FileItem[];
  totalRawChars: number;
}

/**
 * Plans translation batches grouping chapters until target char limit (~10,000 Chinese chars) is reached.
 */
export function planTranslationBatches(
  files: FileItem[],
  targetChars: number = 10000,
  filterStatus?: FileStatus[]
): BatchPlan[] {
  const eligibleFiles = files.filter(f => 
    !filterStatus || filterStatus.includes(f.status)
  );

  const batches: BatchPlan[] = [];
  let currentBatchFiles: FileItem[] = [];
  let currentBatchChars = 0;

  for (const file of eligibleFiles) {
    const fileCharCount = file.content?.length || file.originalCharCount || 0;

    // If adding this file exceeds target (and current batch isn't empty), start a new batch
    if (currentBatchFiles.length > 0 && (currentBatchChars + fileCharCount > targetChars)) {
      batches.push({
        batchIndex: batches.length + 1,
        files: [...currentBatchFiles],
        totalRawChars: currentBatchChars,
      });
      currentBatchFiles = [];
      currentBatchChars = 0;
    }

    currentBatchFiles.push(file);
    currentBatchChars += fileCharCount;
  }

  if (currentBatchFiles.length > 0) {
    batches.push({
      batchIndex: batches.length + 1,
      files: [...currentBatchFiles],
      totalRawChars: currentBatchChars,
    });
  }

  return batches;
}

/**
 * Plans review batches grouping chapters up to review target limit (~20,000 chars / 4-6 chapters).
 */
export function planReviewBatches(
  files: FileItem[],
  targetChars: number = 20000,
  maxChaptersPerBatch: number = 6
): BatchPlan[] {
  const eligibleFiles = files.filter(f => 
    f.draftTranslation && f.draftTranslation.trim().length > 0
  );

  const batches: BatchPlan[] = [];
  let currentBatchFiles: FileItem[] = [];
  let currentBatchChars = 0;

  for (const file of eligibleFiles) {
    const fileCharCount = file.content?.length || file.originalCharCount || 0;

    if (currentBatchFiles.length > 0 && 
        (currentBatchFiles.length >= maxChaptersPerBatch || currentBatchChars + fileCharCount > targetChars)) {
      batches.push({
        batchIndex: batches.length + 1,
        files: [...currentBatchFiles],
        totalRawChars: currentBatchChars,
      });
      currentBatchFiles = [];
      currentBatchChars = 0;
    }

    currentBatchFiles.push(file);
    currentBatchChars += fileCharCount;
  }

  if (currentBatchFiles.length > 0) {
    batches.push({
      batchIndex: batches.length + 1,
      files: [...currentBatchFiles],
      totalRawChars: currentBatchChars,
    });
  }

  return batches;
}

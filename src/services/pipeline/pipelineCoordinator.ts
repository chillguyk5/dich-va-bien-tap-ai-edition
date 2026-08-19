import { FileItem, FileStatus, PipelineConfig, BookStyleProfile, PronounProfile, CharacterAddressingContext, StoryInfo, FewShotExample } from '../../types';
import { planTranslationBatches, planReviewBatches } from './batchPlanner';
import { executeTranslatorBatch } from './translatorStep';
import { executeReviewerBatch } from './reviewerStep';
import { executeEditorSingleChapter } from './editorStep';
import { runDeterministicQA, repairTargetedLines } from './deterministicQA';

export interface PipelineOptions {
  config?: Partial<PipelineConfig>;
  glossary?: string;
  pronounProfile?: PronounProfile;
  bookStyle?: BookStyleProfile;
  characterAddressing?: CharacterAddressingContext;
  fewShotPool?: FewShotExample[];
  storyInfo?: StoryInfo;
  enabledModels?: string[];
  openRouterKey?: string;
  deepseekKey?: string;
  shouldAbort?: () => boolean;
  onChapterUpdate?: (file: FileItem) => void;
  onBatchUpdate?: (updatedFiles: FileItem[]) => void;
  onLog?: (msg: string) => void;
  onProgress?: (percent: number, statusText: string) => void;
}

export class PipelineCoordinator {
  private isRunning: boolean = false;
  private abortRequested: boolean = false;

  public abort() {
    this.abortRequested = true;
    this.isRunning = false;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Runs the complete end-to-end 4-stage pipeline on the provided files.
   */
  public async runFullPipeline(
    files: FileItem[],
    options: PipelineOptions = {}
  ): Promise<FileItem[]> {
    this.isRunning = true;
    this.abortRequested = false;

    const workingFiles = [...files];
    const log = options.onLog || ((msg: string) => console.log(`[Pipeline] ${msg}`));

    try {
      // ─────────────────────────────────────────────────────────────
      // STAGE 1: TRANSLATION & STRUCTURAL VALIDATION
      // ─────────────────────────────────────────────────────────────
      const pendingTranslate = workingFiles.filter(f => 
        f.status === FileStatus.IDLE || f.status === FileStatus.ERROR || !f.draftTranslation
      );

      if (pendingTranslate.length > 0) {
        log(`\n🚀 [STAGE 1] Bắt đầu dịch thô ${pendingTranslate.length} chương...`);
        const batches = planTranslationBatches(
          pendingTranslate,
          options.config?.translationBatchTargetChars || 10000
        );

        for (let bIdx = 0; bIdx < batches.length; bIdx++) {
          if (this.abortRequested || (options.shouldAbort && options.shouldAbort())) {
            log('⏸️ Đã nhận yêu cầu dừng pipeline.');
            break;
          }

          const batch = batches[bIdx];
          log(`Đang dịch batch ${bIdx + 1}/${batches.length} (${batch.files.length} chương)...`);

          // Mark files as translating
          batch.files.forEach(f => {
            f.status = FileStatus.TRANSLATING;
            if (options.onChapterUpdate) options.onChapterUpdate({ ...f });
          });

          try {
            const res = await executeTranslatorBatch(
              batch.files,
              {
                glossary: options.glossary,
                pronounProfile: options.pronounProfile,
                bookStyle: options.bookStyle,
                characterAddressing: options.characterAddressing,
                storyInfo: options.storyInfo,
              },
              {
                enabledModels: options.enabledModels,
                openRouterKey: options.openRouterKey,
                deepseekKey: options.deepseekKey,
                shouldAbort: () => this.abortRequested || !!(options.shouldAbort && options.shouldAbort()),
                onLog: log,
              }
            );

            if (res.success) {
              batch.files.forEach(f => {
                const draft = res.results.get(f.id);
                if (draft) {
                  f.draftTranslation = draft;
                  f.translatedContent = draft; // interim display
                  f.draftModel = res.usedModel;
                  f.usedModel = res.usedModel;
                  f.status = FileStatus.TRANSLATED;
                  f.errorMessage = undefined;
                } else {
                  f.status = FileStatus.ERROR;
                  f.errorMessage = 'Mất kết quả chương sau khi dịch.';
                }
                if (options.onChapterUpdate) options.onChapterUpdate({ ...f });
              });
            } else {
              // Selective retry or mark error
              log(`⚠️ Batch ${bIdx + 1} gặp lỗi cấu trúc: ${res.error}. Đang thử dịch từng chương...`);
              for (const singleFile of batch.files) {
                if (this.abortRequested) break;
                try {
                  const singleRes = await executeTranslatorBatch(
                    [singleFile],
                    {
                      glossary: options.glossary,
                      pronounProfile: options.pronounProfile,
                      bookStyle: options.bookStyle,
                      characterAddressing: options.characterAddressing,
                      storyInfo: options.storyInfo,
                    },
                    {
                      enabledModels: options.enabledModels,
                      openRouterKey: options.openRouterKey,
                      deepseekKey: options.deepseekKey,
                      shouldAbort: () => this.abortRequested,
                      onLog: log,
                    }
                  );
                  const draft = singleRes.results.get(singleFile.id);
                  if (draft) {
                    singleFile.draftTranslation = draft;
                    singleFile.translatedContent = draft;
                    singleFile.draftModel = singleRes.usedModel;
                    singleFile.usedModel = singleRes.usedModel;
                    singleFile.status = FileStatus.TRANSLATED;
                    singleFile.errorMessage = undefined;
                  } else {
                    singleFile.status = FileStatus.ERROR;
                    singleFile.errorMessage = singleRes.error || 'Dịch thất bại.';
                  }
                } catch (singleErr: any) {
                  singleFile.status = FileStatus.ERROR;
                  singleFile.errorMessage = singleErr.message;
                }
                if (options.onChapterUpdate) options.onChapterUpdate({ ...singleFile });
              }
            }
          } catch (batchErr: any) {
            log(`❌ Lỗi batch dịch ${bIdx + 1}: ${batchErr.message}`);
            batch.files.forEach(f => {
              f.status = FileStatus.ERROR;
              f.errorMessage = batchErr.message;
              if (options.onChapterUpdate) options.onChapterUpdate({ ...f });
            });
          }

          if (options.onBatchUpdate) options.onBatchUpdate([...workingFiles]);
        }
      }

      // ─────────────────────────────────────────────────────────────
      // STAGE 2: REVIEWER / BETA
      // ─────────────────────────────────────────────────────────────
      const pendingReview = workingFiles.filter(f => 
        (f.status === FileStatus.TRANSLATED || f.draftTranslation) && !f.reviewReport
      );

      if (pendingReview.length > 0 && !this.abortRequested) {
        log(`\n🔍 [STAGE 2] Bắt đầu thẩm định Beta ${pendingReview.length} chương...`);
        const reviewBatches = planReviewBatches(
          pendingReview,
          options.config?.reviewBatchTargetChars || 20000,
          6
        );

        for (let bIdx = 0; bIdx < reviewBatches.length; bIdx++) {
          if (this.abortRequested || (options.shouldAbort && options.shouldAbort())) break;

          const batch = reviewBatches[bIdx];
          log(`Đang thẩm định batch ${bIdx + 1}/${reviewBatches.length} (${batch.files.length} chương)...`);

          batch.files.forEach(f => {
            f.status = FileStatus.REVIEWING;
            if (options.onChapterUpdate) options.onChapterUpdate({ ...f });
          });

          try {
            const res = await executeReviewerBatch(
              batch.files,
              {
                bookStyle: options.bookStyle,
                glossary: options.glossary,
              },
              {
                enabledModels: options.enabledModels,
                openRouterKey: options.openRouterKey,
                deepseekKey: options.deepseekKey,
                shouldAbort: () => this.abortRequested,
                onLog: log,
              }
            );

            if (res.success) {
              batch.files.forEach(f => {
                const report = res.reports.get(f.id);
                if (report) {
                  f.reviewReport = report;
                  f.reviewModel = res.usedModel;
                  f.status = FileStatus.REVIEWED;
                }
                if (options.onChapterUpdate) options.onChapterUpdate({ ...f });
              });
            }
          } catch (reviewErr: any) {
            log(`⚠️ Thẩm định batch ${bIdx + 1} có lỗi: ${reviewErr.message}. Tiếp tục sang Editor.`);
            batch.files.forEach(f => {
              f.status = FileStatus.REVIEWED; // Proceed to editor even if review batch failed
              if (options.onChapterUpdate) options.onChapterUpdate({ ...f });
            });
          }

          if (options.onBatchUpdate) options.onBatchUpdate([...workingFiles]);
        }
      }

      // ─────────────────────────────────────────────────────────────
      // STAGE 3: EDITOR (SINGLE CHAPTER)
      // ─────────────────────────────────────────────────────────────
      const pendingEdit = workingFiles.filter(f => 
        (f.status === FileStatus.REVIEWED || f.draftTranslation) && !f.editedTranslation
      );

      if (pendingEdit.length > 0 && !this.abortRequested) {
        log(`\n✍️ [STAGE 3] Bắt đầu biên tập từng chương (${pendingEdit.length} chương)...`);

        for (let idx = 0; idx < pendingEdit.length; idx++) {
          if (this.abortRequested || (options.shouldAbort && options.shouldAbort())) break;

          const file = pendingEdit[idx];

          // Check if auto-skip editor when review passed with high score
          if (options.config?.autoSkipEditorIfPass && 
              file.reviewReport && 
              file.reviewReport.score >= (options.config.editorPassScoreThreshold || 9.0) &&
              file.reviewReport.issues.length === 0) {
            log(`⏩ [${file.name}] Điểm Review đạt ${file.reviewReport.score}/10 -> Bỏ qua Editor.`);
            file.editedTranslation = file.draftTranslation;
            file.status = FileStatus.EDITED;
            if (options.onChapterUpdate) options.onChapterUpdate({ ...file });
            continue;
          }

          file.status = FileStatus.EDITING;
          if (options.onChapterUpdate) options.onChapterUpdate({ ...file });

          try {
            const editRes = await executeEditorSingleChapter(
              file,
              {
                bookStyle: options.bookStyle,
                rawMode: options.config?.editorRawMode || 'hybrid',
                fewShotPool: options.fewShotPool,
                contextLines: options.config?.hybridContextLines || 2,
              },
              {
                enabledModels: options.enabledModels,
                openRouterKey: options.openRouterKey,
                deepseekKey: options.deepseekKey,
                shouldAbort: () => this.abortRequested,
                onLog: log,
              }
            );

            if (editRes.success) {
              file.editedTranslation = editRes.editedContent;
              file.translatedContent = editRes.editedContent;
              file.editedModel = editRes.usedModel;
              file.status = FileStatus.EDITED;
            } else {
              log(`⚠️ Biên tập [${file.name}] lỗi: ${editRes.error}. Giữ lại bản draft.`);
              file.editedTranslation = file.draftTranslation;
              file.status = FileStatus.EDITED;
            }
          } catch (editErr: any) {
            log(`⚠️ Lỗi biên tập [${file.name}]: ${editErr.message}.`);
            file.editedTranslation = file.draftTranslation;
            file.status = FileStatus.EDITED;
          }

          if (options.onChapterUpdate) options.onChapterUpdate({ ...file });
        }
      }

      // ─────────────────────────────────────────────────────────────
      // STAGE 4: DETERMINISTIC QA & FIX CHINESE
      // ─────────────────────────────────────────────────────────────
      const pendingQA = workingFiles.filter(f => 
        f.status === FileStatus.EDITED || f.editedTranslation || f.draftTranslation
      );

      if (pendingQA.length > 0 && !this.abortRequested) {
        log(`\n🛡️ [STAGE 4] Chạy hậu kiểm tất định & khử Hán tự sót (${pendingQA.length} chương)...`);

        for (const file of pendingQA) {
          if (this.abortRequested) break;

          file.status = FileStatus.QA_CHECKING;
          const textToVerify = file.editedTranslation || file.draftTranslation || file.translatedContent || '';

          const qa = runDeterministicQA(file.content, textToVerify, options.glossary);
          let finalContent = qa.cleanedText;

          // If Chinese characters still remain, run targeted repair
          if (qa.residueChineseCount > 0) {
            log(`[${file.name}] Sót ${qa.residueChineseCount} chữ Hán -> Chạy sửa dòng mục tiêu...`);
            file.status = FileStatus.QA_REPAIRING;
            finalContent = await repairTargetedLines(finalContent, options.glossary);
          }

          file.finalTranslation = finalContent;
          file.translatedContent = finalContent;
          file.status = FileStatus.COMPLETED;
          file.qaIssues = qa.issues;

          if (options.onChapterUpdate) options.onChapterUpdate({ ...file });
        }
      }

      log(`\n🎉 Hoàn thành toàn bộ quy trình cho ${workingFiles.length} chương!`);
    } finally {
      this.isRunning = false;
    }

    return workingFiles;
  }
}

export const pipelineCoordinator = new PipelineCoordinator();

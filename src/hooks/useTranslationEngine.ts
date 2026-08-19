import { useState, useRef, useEffect, useCallback } from 'react';
import { FileItem, FileStatus, TranslationTier } from '../types';
import { pipelineCoordinator } from '../services/pipeline/pipelineCoordinator';
import { executeTranslatorBatch } from '../services/pipeline/translatorStep';
import { executeReviewerBatch } from '../services/pipeline/reviewerStep';
import { executeEditorSingleChapter } from '../services/pipeline/editorStep';
import { runDeterministicQA, repairTargetedLines } from '../services/pipeline/deterministicQA';

export const useTranslationEngine = (core: any, ui: any) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentStageText, setCurrentStageText] = useState<string>('');
  const [translationTier, setTranslationTier] = useState<TranslationTier>('normal');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);

  const shouldAbortRef = useRef<boolean>(false);

  const stopProcessing = useCallback(() => {
    shouldAbortRef.current = true;
    pipelineCoordinator.abort();
    setIsProcessing(false);
    setEndTime(Date.now());
    ui.addToast('Đã dừng tiến trình.', 'info');
  }, [ui]);

  const handleUpdateChapter = useCallback((updated: FileItem) => {
    core.setFiles((prev: FileItem[]) => 
      prev.map(f => f.id === updated.id ? { ...f, ...updated } : f)
    );
  }, [core]);

  // Execute Full 4-Stage Pipeline
  const executeProcessing = useCallback(async (scope: 'all' | 'selected' = 'all') => {
    const targetFiles = scope === 'selected' && ui.selectedFiles.size > 0
      ? core.files.filter((f: FileItem) => ui.selectedFiles.has(f.id))
      : core.files;

    if (!targetFiles.length) {
      ui.addToast('Không có chương nào để xử lý.', 'warning');
      return;
    }

    setIsProcessing(true);
    shouldAbortRef.current = false;
    setStartTime(Date.now());
    setEndTime(null);

    const log = (msg: string) => {
      if (ui.addLog) ui.addLog(msg);
    };

    try {
      await pipelineCoordinator.runFullPipeline(targetFiles, {
        config: core.pipelineConfig,
        glossary: core.additionalDictionary,
        pronounProfile: core.pronounProfile,
        bookStyle: core.bookStyle,
        characterAddressing: core.characterAddressing,
        fewShotPool: core.fewShotPool,
        storyInfo: core.storyInfo,
        enabledModels: core.enabledModels,
        openRouterKey: core.openRouterKey,
        deepseekKey: core.deepseekKey,
        shouldAbort: () => shouldAbortRef.current,
        onChapterUpdate: handleUpdateChapter,
        onLog: log,
      });
      ui.addToast('Hoàn thành toàn bộ quy trình 4 tầng!', 'success');
    } catch (err: any) {
      log(`❌ Lỗi thực thi pipeline: ${err.message}`);
      ui.addToast(`Lỗi: ${err.message}`, 'error');
    } finally {
      setIsProcessing(false);
      setEndTime(Date.now());
    }
  }, [core, ui, handleUpdateChapter]);

  // Stage 1: Dịch thô lẻ
  const executeTranslateOnly = useCallback(async (scope: 'all' | 'selected' = 'all') => {
    const targetFiles = scope === 'selected' && ui.selectedFiles.size > 0
      ? core.files.filter((f: FileItem) => ui.selectedFiles.has(f.id))
      : core.files;

    if (!targetFiles.length) return;

    setIsProcessing(true);
    shouldAbortRef.current = false;
    setStartTime(Date.now());
    setEndTime(null);

    const log = (msg: string) => ui.addLog && ui.addLog(msg);

    try {
      log(`🚀 Bắt đầu dịch thô ${targetFiles.length} chương...`);
      for (const file of targetFiles) {
        if (shouldAbortRef.current) break;
        file.status = FileStatus.TRANSLATING;
        handleUpdateChapter(file);

        const res = await executeTranslatorBatch([file], {
          glossary: core.additionalDictionary,
          pronounProfile: core.pronounProfile,
          bookStyle: core.bookStyle,
          characterAddressing: core.characterAddressing,
          storyInfo: core.storyInfo,
        }, {
          enabledModels: core.enabledModels,
          openRouterKey: core.openRouterKey,
          deepseekKey: core.deepseekKey,
          shouldAbort: () => shouldAbortRef.current,
          onLog: log,
        });

        if (res.success) {
          const draft = res.results.get(file.id);
          if (draft) {
            file.draftTranslation = draft;
            file.translatedContent = draft;
            file.draftModel = res.usedModel;
            file.usedModel = res.usedModel;
            file.status = FileStatus.TRANSLATED;
          }
        } else {
          file.status = FileStatus.ERROR;
          file.errorMessage = res.error;
        }
        handleUpdateChapter(file);
      }
      ui.addToast('Đã hoàn thành dịch thô!', 'success');
    } catch (e: any) {
      ui.addToast(`Lỗi dịch: ${e.message}`, 'error');
    } finally {
      setIsProcessing(false);
      setEndTime(Date.now());
    }
  }, [core, ui, handleUpdateChapter]);

  // Stage 2: Thẩm định Beta lẻ
  const executeReviewOnly = useCallback(async (scope: 'all' | 'selected' = 'all') => {
    const targetFiles = scope === 'selected' && ui.selectedFiles.size > 0
      ? core.files.filter((f: FileItem) => ui.selectedFiles.has(f.id))
      : core.files.filter((f: FileItem) => f.draftTranslation || f.translatedContent);

    if (!targetFiles.length) return;

    setIsProcessing(true);
    shouldAbortRef.current = false;
    setStartTime(Date.now());
    setEndTime(null);

    const log = (msg: string) => ui.addLog && ui.addLog(msg);

    try {
      log(`🔍 Thẩm định Beta ${targetFiles.length} chương...`);
      const res = await executeReviewerBatch(targetFiles, {
        bookStyle: core.bookStyle,
        glossary: core.additionalDictionary,
      }, {
        enabledModels: core.enabledModels,
        openRouterKey: core.openRouterKey,
        deepseekKey: core.deepseekKey,
        shouldAbort: () => shouldAbortRef.current,
        onLog: log,
      });

      if (res.success) {
        targetFiles.forEach(f => {
          const report = res.reports.get(f.id);
          if (report) {
            f.reviewReport = report;
            f.reviewModel = res.usedModel;
            f.status = FileStatus.REVIEWED;
            handleUpdateChapter(f);
          }
        });
        ui.addToast('Đã hoàn thành thẩm định Beta!', 'success');
      }
    } catch (e: any) {
      ui.addToast(`Lỗi thẩm định: ${e.message}`, 'error');
    } finally {
      setIsProcessing(false);
      setEndTime(Date.now());
    }
  }, [core, ui, handleUpdateChapter]);

  // Stage 3: Biên tập Editor lẻ
  const executeEditOnly = useCallback(async (scope: 'all' | 'selected' = 'all') => {
    const targetFiles = scope === 'selected' && ui.selectedFiles.size > 0
      ? core.files.filter((f: FileItem) => ui.selectedFiles.has(f.id))
      : core.files.filter((f: FileItem) => f.draftTranslation || f.translatedContent);

    if (!targetFiles.length) return;

    setIsProcessing(true);
    shouldAbortRef.current = false;
    setStartTime(Date.now());
    setEndTime(null);

    const log = (msg: string) => ui.addLog && ui.addLog(msg);

    try {
      log(`✍️ Biên tập ${targetFiles.length} chương...`);
      for (const file of targetFiles) {
        if (shouldAbortRef.current) break;
        file.status = FileStatus.EDITING;
        handleUpdateChapter(file);

        const res = await executeEditorSingleChapter(file, {
          bookStyle: core.bookStyle,
          rawMode: core.pipelineConfig?.editorRawMode || 'hybrid',
          fewShotPool: core.fewShotPool,
          contextLines: core.pipelineConfig?.hybridContextLines || 2,
        }, {
          enabledModels: core.enabledModels,
          openRouterKey: core.openRouterKey,
          deepseekKey: core.deepseekKey,
          shouldAbort: () => shouldAbortRef.current,
          onLog: log,
        });

        if (res.success) {
          file.editedTranslation = res.editedContent;
          file.translatedContent = res.editedContent;
          file.editedModel = res.usedModel;
          file.status = FileStatus.EDITED;
        } else {
          file.status = FileStatus.ERROR;
          file.errorMessage = res.error;
        }
        handleUpdateChapter(file);
      }
      ui.addToast('Đã hoàn thành biên tập!', 'success');
    } catch (e: any) {
      ui.addToast(`Lỗi biên tập: ${e.message}`, 'error');
    } finally {
      setIsProcessing(false);
      setEndTime(Date.now());
    }
  }, [core, ui, handleUpdateChapter]);

  // Stage 4: Hậu kiểm QA lẻ
  const executeQAOnly = useCallback(async (scope: 'all' | 'selected' = 'all') => {
    const targetFiles = scope === 'selected' && ui.selectedFiles.size > 0
      ? core.files.filter((f: FileItem) => ui.selectedFiles.has(f.id))
      : core.files.filter((f: FileItem) => f.translatedContent || f.editedTranslation || f.draftTranslation);

    if (!targetFiles.length) return;

    setIsProcessing(true);
    shouldAbortRef.current = false;
    setStartTime(Date.now());
    setEndTime(null);

    const log = (msg: string) => ui.addLog && ui.addLog(msg);

    try {
      log(`🛡️ Chạy hậu kiểm QA cho ${targetFiles.length} chương...`);
      for (const file of targetFiles) {
        if (shouldAbortRef.current) break;
        file.status = FileStatus.QA_CHECKING;
        handleUpdateChapter(file);

        const currentText = file.editedTranslation || file.draftTranslation || file.translatedContent || '';
        const qa = runDeterministicQA(file.content, currentText, core.additionalDictionary);
        let finalContent = qa.cleanedText;

        if (qa.residueChineseCount > 0) {
          file.status = FileStatus.QA_REPAIRING;
          handleUpdateChapter(file);
          finalContent = await repairTargetedLines(finalContent, core.additionalDictionary);
        }

        file.finalTranslation = finalContent;
        file.translatedContent = finalContent;
        file.status = FileStatus.COMPLETED;
        file.qaIssues = qa.issues;
        handleUpdateChapter(file);
      }
      ui.addToast('Đã hoàn thành hậu kiểm QA!', 'success');
    } catch (e: any) {
      ui.addToast(`Lỗi QA: ${e.message}`, 'error');
    } finally {
      setIsProcessing(false);
      setEndTime(Date.now());
    }
  }, [core, ui, handleUpdateChapter]);

  return {
    isProcessing,
    currentStageText,
    translationTier,
    setTranslationTier,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    executeProcessing,
    stopProcessing,
    executeTranslateOnly,
    executeReviewOnly,
    executeEditOnly,
    executeQAOnly,
  };
};

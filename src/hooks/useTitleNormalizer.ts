import { useState, useRef } from 'react';
import { FileItem } from '../types';
import { executeTaskInference } from '../services/inference/providerManager';
import { fixMergedTitle, formatBookStyle } from '../utils/text';

export const useTitleNormalizer = (core: any, ui: any) => {
  const [isNormalizingTitles, setIsNormalizingTitles] = useState<boolean>(false);
  const isNormalizingRef = useRef<boolean>(false);

  const handleTitleNormalization = async (scope: 'all' | 'selected' = 'all') => {
    if (core.storyInfo?.enableTitleFormatting === false) {
      if (ui.addLog) ui.addLog("Đã bỏ qua bước chuẩn hóa tiêu đề do cài đặt.", "info");
      return true;
    }

    const allCandidates = core.files.filter((f: FileItem) => {
      if (scope === 'selected' && !ui.selectedFiles.has(f.id)) return false;
      if (!f.translatedContent) return false;
      return true;
    });

    if (allCandidates.length === 0) {
      ui.addToast("Không tìm thấy chương nào cần chuẩn hóa tiêu đề.", "info");
      return false;
    }

    setIsNormalizingTitles(true);
    isNormalizingRef.current = true;

    const localUpdates: { id: string; content: string }[] = [];

    for (const f of allCandidates) {
      const fixedContent = fixMergedTitle(f.translatedContent || "");
      const cleanContent = formatBookStyle(
        fixedContent,
        f.content,
        core.storyInfo?.enableTitleFormatting !== false,
        core.storyInfo?.titleFormat,
        core.storyInfo?.enableAutoFormat !== false
      );
      if (cleanContent !== f.translatedContent || scope === 'selected') {
        localUpdates.push({ id: f.id, content: cleanContent });
      }
    }

    if (localUpdates.length > 0) {
      core.setFiles((prev: FileItem[]) => prev.map((f: FileItem) => {
        const update = localUpdates.find(u => u.id === f.id);
        return update ? { ...f, translatedContent: update.content } : f;
      }));
      ui.addToast(`Đã chuẩn hóa tiêu đề cho ${localUpdates.length} chương.`, 'success');
    }

    setIsNormalizingTitles(false);
    isNormalizingRef.current = false;
    return true;
  };

  const stopTitleNormalization = () => {
    isNormalizingRef.current = false;
    setIsNormalizingTitles(false);
  };

  return {
    isNormalizingTitles,
    handleTitleNormalization,
    stopTitleNormalization,
  };
};

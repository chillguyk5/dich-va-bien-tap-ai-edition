import { StoryInfo } from '../../types';
import { executeTaskInference } from '../../services/inference/providerManager';

export const useContextAnalysisHandlers = (core: any, ui: any) => {
  const handleRefineSummary = async () => {
    if (!core.storyInfo.summary) {
      ui.addToast('Vui lòng nhập tóm tắt trước khi trau chuốt.', 'warning');
      return;
    }

    try {
      ui.addToast('Đang trau chuốt tóm tắt bằng AI...', 'info');
      const res = await executeTaskInference(
        'style_forge',
        'Bạn là biên tập viên văn học tiếng Việt cao cấp. Hãy trau chuốt bản tóm tắt tiểu thuyết sau cho mượt mà, cuốn hút, chuẩn văn phong tiếng Việt xuất bản.',
        core.storyInfo.summary,
        { taskName: 'Trau chuốt tóm tắt truyện' }
      );

      if (res.text) {
        core.setStoryInfo((prev: StoryInfo) => ({ ...prev, summary: res.text.trim() }));
        ui.addToast('Đã trau chuốt tóm tắt thành công!', 'success');
      }
    } catch (e: any) {
      ui.addToast(`Lỗi trau chuốt tóm tắt: ${e.message}`, 'error');
    }
  };

  const handleRefineContext = async () => {
    if (!core.storyInfo.contextNotes) {
      ui.addToast('Chưa có ghi chú ngữ cảnh để trau chuốt.', 'warning');
      return;
    }

    try {
      ui.setIsRefiningContext(true);
      ui.addToast('Đang tổ chức lại ghi chú bối cảnh...', 'info');
      const res = await executeTaskInference(
        'style_forge',
        'Bạn là chuyên gia thiết kế Series Bible tiểu thuyết. Hãy chuẩn hóa, phân loại rõ ràng (Địa danh, Công pháp, Thế lực, Đẳng cấp) cho các ghi chú bối cảnh sau.',
        core.storyInfo.contextNotes,
        { taskName: 'Chuẩn hóa Series Bible' }
      );

      if (res.text) {
        core.setStoryInfo((prev: StoryInfo) => ({ ...prev, contextNotes: res.text.trim() }));
        ui.addToast('Đã chuẩn hóa Series Bible thành công!', 'success');
      }
    } catch (e: any) {
      ui.addToast(`Lỗi chuẩn hóa bối cảnh: ${e.message}`, 'error');
    } finally {
      ui.setIsRefiningContext(false);
    }
  };

  const handleQuickParse = async () => {
    if (!ui.quickInput || !ui.quickInput.trim()) {
      ui.addToast('Vui lòng nhập nội dung để phân tích nhanh.', 'warning');
      return;
    }

    try {
      ui.addToast('Đang phân tích thông tin truyện...', 'info');
      const res = await executeTaskInference(
        'style_forge',
        `Hãy phân tích đoạn văn bản giới thiệu truyện sau và trích xuất thông tin dưới dạng JSON:
{
  "title": "Tên truyện (tiếng Việt hoặc Hán Việt)",
  "author": "Tên tác giả",
  "genres": ["Thể loại 1", "Thể loại 2"],
  "summary": "Tóm tắt truyện cô đọng"
}`,
        ui.quickInput,
        { jsonOutput: true, taskName: 'Phân tích nhanh thông tin truyện' }
      );

      let cleanJson = res.text.trim();
      if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      }

      const parsed = JSON.parse(cleanJson);
      core.setStoryInfo((prev: StoryInfo) => ({
        ...prev,
        title: parsed.title || prev.title,
        author: parsed.author || prev.author,
        genres: parsed.genres || prev.genres,
        summary: parsed.summary || prev.summary,
      }));
      ui.addToast('Đã trích xuất thông tin truyện thành công!', 'success');
    } catch (e: any) {
      ui.addToast(`Lỗi phân tích: ${e.message}`, 'error');
    }
  };

  return {
    handleRefineSummary,
    handleRefineContext,
    handleQuickParse,
    handleContextFileUpload: (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          core.setStoryInfo((prev: StoryInfo) => ({
            ...prev,
            contextNotes: (prev.contextNotes ? prev.contextNotes + '\n\n' : '') + text,
          }));
          ui.addToast('Đã nạp file bối cảnh thành công!', 'success');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    handlePromptUpload: (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          core.setPromptTemplate(text);
          ui.addToast('Đã nạp Prompt tùy chỉnh thành công!', 'success');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    handleDictionaryUpload: (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          core.setAdditionalDictionary((prev: string) => (prev ? prev + '\n' : '') + text);
          ui.addToast('Đã nạp từ điển bổ sung!', 'success');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
  };
};

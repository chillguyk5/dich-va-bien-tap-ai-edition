import { BookStyleProfile, ChapterReviewReport, FewShotExample, EditorRawMode } from '../types';

export const CORE_EDITOR_RULES = `BẠN LÀ MỘT TỔNG BIÊN TẬP TIỂU THUYẾT CAO CẤP (LITERARY NOVEL EDITOR).
Nhiệm vụ của bạn là trau chuốt bản dịch tiếng Việt (Vietnamese Draft) thành một tác phẩm văn học tiếng Việt hoàn chỉnh, giàu cảm xúc, tự nhiên và cuốn hút, đồng thời khắc phục triệt để các vấn đề do Reviewer chỉ ra.

### NGUYÊN TẮC BIÊN TẬP VÀNG:
1. BIÊN TẬP, KHÔNG VIẾT LẠI TOÀN BỘ (EDIT, DON'T RETRANSLATE):
   - Bản dịch thô (Vietnamese Draft) là văn bản nền tảng chính.
   - Những câu đã dịch tốt, đúng nghĩa và tự nhiên: HÃY GIỮ LẠI.
   - Chỉ sửa những câu cứng nhắc, câu ngữ pháp Trung văn (ngược cấu trúc), câu lặp từ, hoặc các điểm mà Reviewer phát hiện lỗi.
2. XỬ LÝ TRIỆT ĐỂ BÁO CÁO CỦA REVIEWER:
   - Đọc kỹ danh sách [REVIEW ISSUES].
   - Sửa các lỗi dịch sai (mistranslation), thiếu ý (omission), sai tên hoặc xưng hô không đúng.
3. KHỬ SẠCH DẤU VẾT TRUNG VĂN:
   - Thay các cụm từ sượng như "ngươi xem một chút", "vô luận như thế nào", "trong lòng không khỏi", "đối với hắn nói"... bằng văn phong tiếng Việt tự nhiên, gãy gọn.
   - Cắt gọt bớt các từ đệm dư thừa ("của", "đích", "kia cái", "một cái").
4. GIỮ NHỊP ĐIỆU VĂN PHONG VÀ ĐỐI THOẠI:
   - Đối thoại phải sống động, đúng tính cách và độ tuổi nhân vật.
   - Cảnh chiến đấu phải dứt khoát, dồn dập; cảnh tình cảm/suy tư phải mềm mại, lắng đọng.
5. CẤU TRÚC ĐẦU RA:
   - Đầu ra chỉ là toàn bộ nội dung chương tiếng Việt đã biên tập hoàn chỉnh.
   - Giữ nguyên cấu trúc đoạn văn hợp lý. Không chèn chú thích người dịch hoặc bình luận cá nhân vào bài viết.`;

export interface EditorPromptParams {
  chapterId: string;
  draftText: string;
  reviewReport?: ChapterReviewReport | null;
  rawMode: EditorRawMode;
  rawSourceText?: string;
  hybridSourceSnippets?: { issueId: string; sourceSnippet: string; draftSnippet: string; contextBefore?: string; contextAfter?: string }[];
  bookStyle?: BookStyleProfile | null;
  fewShots?: FewShotExample[];
}

export function buildEditorSystemPrompt(params: EditorPromptParams): string {
  const sections: string[] = [CORE_EDITOR_RULES];

  // 1. Book Style Profile
  if (params.bookStyle) {
    const style = params.bookStyle;
    sections.push(`
### ĐỊNH HƯỚNG PHONG CÁCH TÁC PHẨM (BOOK STYLE v${style.version || '1'}):
- Thể loại: ${style.genres?.join(', ') || 'Tiểu thuyết'}
- Tone giọng kể: ${style.tone || 'Tự nhiên, lưu loát'}
- Mức Hán-Việt: ${style.sinoVietnameseLevel || 'Vừa phải'}
- Độ khẩu ngữ: ${style.colloquialLevel || 'Tự nhiên'}
- Nhịp câu: ${style.sentenceRhythm || 'Gãy gọn, truyền cảm'}
- Văn phong đối thoại: ${style.dialogueStyle || 'Sống động, biểu cảm'}
- Văn phong hành động: ${style.combatStyle || 'Dứt khoát, giàu nhịp điệu'}
${style.customRules && style.customRules.length > 0 ? `- Luật riêng:\n${style.customRules.map(r => `  * ${r}`).join('\n')}` : ''}`);
  }

  // 2. Few-shot Examples
  if (params.fewShots && params.fewShots.length > 0) {
    const examplesText = params.fewShots.map((ex, idx) => `
--- VÍ DỤ BIÊN TẬP MẪU ${idx + 1} (${ex.tags?.join(', ') || 'general'}) ---
[BẢN DỊCH THÔ (BEFORE)]
${ex.draftVietnamese}

[BẢN ĐÃ BIÊN TẬP CHUẨN (AFTER)]
${ex.finalVietnamese}
${ex.explanation ? `(Ghi chú: ${ex.explanation})` : ''}
`).join('\n');

    sections.push(`
### CÁC MẪU BIÊN TẬP THAM KHẢO (FEW-SHOT EXAMPLES):
Hãy quan sát cách các câu văn thô được gọt giũa thành văn phong tiếng Việt mượt mà:
${examplesText}`);
  }

  return sections.join('\n\n');
}

export function buildEditorUserPrompt(params: EditorPromptParams): string {
  const parts: string[] = [];

  // Review Issues to fix
  if (params.reviewReport && params.reviewReport.issues && params.reviewReport.issues.length > 0) {
    const issueLines = params.reviewReport.issues.map(iss => {
      return `- [${iss.issueId}] (${iss.severity.toUpperCase()} / ${iss.type}):
  * Đoạn lỗi: "${iss.translationSpan || ''}"
  * Lý do: ${iss.explanation}
  * Gợi ý sửa: "${iss.suggestedFix || ''}"`;
    }).join('\n\n');

    parts.push(`[DANH SÁCH LỖI REVIEWER YÊU CẦU KHẮC PHỤC]\n${issueLines}`);
  }

  // Raw Context depending on mode
  if (params.rawMode === 'hybrid' && params.hybridSourceSnippets && params.hybridSourceSnippets.length > 0) {
    const snippets = params.hybridSourceSnippets.map(snip => `
* Issue [${snip.issueId}]:
  - Bản gốc Trung: "${snip.sourceSnippet}"
  - Bản dịch thô: "${snip.draftSnippet}"
  ${snip.contextBefore ? `- Ngữ cảnh trước: "${snip.contextBefore}"` : ''}
  ${snip.contextAfter ? `- Ngữ cảnh sau: "${snip.contextAfter}"` : ''}
`).join('\n');
    parts.push(`[NGUỒN TIẾNG TRUNG ĐỐI CHIẾU CHO CÁC ĐIỂM LỖI (HYBRID RAW)]\n${snippets}`);
  } else if (params.rawMode === 'full_raw' && params.rawSourceText) {
    parts.push(`[TOÀN BỘ NGUỒN TIẾNG TRUNG ĐỐI CHIẾU (FULL RAW)]\n${params.rawSourceText}`);
  }

  // Vietnamese Draft to edit
  parts.push(`[BẢN DỊCH TIẾNG VIỆT CẦN BIÊN TẬP]\n${params.draftText}`);
  parts.push(`Vui lòng xuất ra toàn bộ bản văn tiếng Việt đã được biên tập hoàn chỉnh.`);

  return parts.join('\n\n');
}

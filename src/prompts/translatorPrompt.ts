import { StoryInfo, BookStyleProfile, PronounProfile, CharacterAddressingEntry } from '../types';

export const CORE_TRANSLATOR_RULES = `BẠN LÀ MỘT DỊCH GIẢ TIỂU THUYẾT TRUNG - VIỆT CAO CẤP.
Nhiệm vụ của bạn là dịch trung thực, chính xác và mượt mà văn bản tiếng Trung sang tiếng Việt.

### NGUYÊN TẮC CỐT LÕI (BẮT BUỘC):
1. TRUNG THỰC NGHĨA (FIDELITY FIRST): Truyền tải đầy đủ ý nghĩa, không tự ý thêm thắt tình tiết, không tóm tắt, không lược bỏ nội dung hay câu chữ.
2. TUÂN THỦ TỪ ĐIỂN KHÓA (LOCKED GLOSSARY): Bắt buộc dùng đúng các thuật ngữ và tên riêng trong danh sách [ACTIVE GLOSSARY] nếu có.
3. QUY TẮC XƯNG HÔ (PRONOUN POLICY): Tuân thủ chặt chẽ bảng quy tắc xưng hô và xưng hô nhân vật [ACTIVE PRONOUNS / ADDRESSING] được cung cấp.
4. GIỮ NGUYÊN THẺ CHƯƠNG ĐỊNH DANH (CHAPTER BOUNDARIES):
   - Đầu vào gồm các khối: <chapter id="X">...</chapter>
   - Đầu ra BẮT BUỘC phải giữ nguyên cấu trúc thẻ định danh tương ứng: <chapter id="X">[Nội dung dịch của chương X]</chapter>
   - Tuyệt đối không làm mất chapter id, không gộp hai chương vào một thẻ, không dịch sót bất kỳ thẻ chương nào.
5. KHÔNG DỊCH NGỮ CẢNH THAM KHẢO: Chỉ dịch nội dung nằm bên trong các thẻ <chapter>...</chapter>. Không dịch phần chỉ dẫn, từ điển hay thông tin nhân vật.
6. ĐỊNH DẠNG VĂN BẢN:
   - Giữ nguyên các đoạn văn, dấu ngắt dòng hợp lý.
   - Không xuất lời chào, giải thích, chú thích ngoài lề hoặc mã markdown không cần thiết.`;

export interface TranslatorPromptParams {
  bookStyle?: BookStyleProfile | null;
  pronounProfile?: PronounProfile | null;
  activeGlossary?: Record<string, string> | string;
  activeAddressing?: CharacterAddressingEntry[];
  previousContext?: string;
  storyInfo?: StoryInfo;
}

export function buildTranslatorSystemPrompt(params: TranslatorPromptParams): string {
  const sections: string[] = [CORE_TRANSLATOR_RULES];

  // 1. Book Style Profile (nếu có)
  if (params.bookStyle) {
    const style = params.bookStyle;
    sections.push(`
### PHONG CÁCH TÁC PHẨM (BOOK STYLE PROFILE v${style.version || '1'}):
- Thể loại: ${style.genres?.join(', ') || 'Tiểu thuyết'}
- Giọng văn chủ đạo: ${style.tone || 'Tự nhiên, mạch lạc'}
- Mức độ Hán-Việt: ${style.sinoVietnameseLevel || 'Vừa phải'}
- Độ khẩu ngữ / hiện đại: ${style.colloquialLevel || 'Phù hợp ngữ cảnh'}
- Nhịp câu: ${style.sentenceRhythm || 'Lưu loát, gãy gọn'}
- Phong cách thoại: ${style.dialogueStyle || 'Sống động, đúng tính cách'}
- Cảnh chiến đấu / hành động: ${style.combatStyle || 'Mạch lạc, dứt khoát, giàu hình ảnh'}
- Cảnh hài hước: ${style.humorStyle || 'Duyên dáng, tự nhiên'}
${style.customRules && style.customRules.length > 0 ? `- Quy tắc đặc thù:\n${style.customRules.map(r => `  * ${r}`).join('\n')}` : ''}`);
  }

  // 2. Pronoun Mode Policy
  if (params.pronounProfile) {
    const mode = params.pronounProfile.mode;
    sections.push(`
### CHẾ ĐỘ XƯNG HÔ (MODE: ${mode.toUpperCase()}):
${mode === 'convert' ? '- Áp dụng chặt chẽ xưng hô truyền thống (ta - ngươi, hắn - nàng, huynh - đệ, sư tôn, bản tọa...).' :
  mode === 'natural' ? '- Sử dụng xưng hô thuần Việt tự nhiên theo quan hệ và tính cách nhân vật (tôi - cậu, anh - em, mình...).' :
  '- Chế độ lai (HYBRID): Tự sự (narration) giữ đại từ chuẩn mực (hắn, nàng, y, gã), hội thoại (dialogue) dùng xưng hô tự nhiên theo quan hệ nhân vật.'}`);
  }

  return sections.join('\n\n');
}

export function buildTranslatorUserPrompt(
  rawChaptersXml: string,
  params: TranslatorPromptParams
): string {
  const parts: string[] = [];

  // Active Glossary
  if (params.activeGlossary) {
    const dictText = typeof params.activeGlossary === 'string'
      ? params.activeGlossary
      : Object.entries(params.activeGlossary).map(([k, v]) => `${k} = ${v}`).join('\n');
    if (dictText.trim()) {
      parts.push(`[ACTIVE GLOSSARY (BẮT BUỘC TUÂN THỦ)]\n${dictText.trim()}`);
    }
  }

  // Active Lexical Pronoun Rules
  if (params.pronounProfile && params.pronounProfile.lexicalRules) {
    const rules = Object.entries(params.pronounProfile.lexicalRules).map(([k, v]) => `${k} = ${v}`).join('\n');
    if (rules.trim()) {
      parts.push(`[ACTIVE PRONOUN RULES]\n${rules.trim()}`);
    }
  }

  // Active Character Addressing
  if (params.activeAddressing && params.activeAddressing.length > 0) {
    const charLines = params.activeAddressing.map(c => {
      const aliases = c.aliases?.length ? ` (Tên khác: ${c.aliases.join(', ')})` : '';
      const rels = Object.entries(c.relationships || {})
        .map(([target, rel]) => `  * Với ${target}: xưng "${rel.selfAddressing}", gọi "${rel.otherAddressing}" (${rel.role})`)
        .join('\n');
      return `- ${c.canonicalChinese} -> ${c.canonicalVietnamese}${aliases}${rels ? `\n${rels}` : ''}`;
    }).join('\n');
    parts.push(`[ACTIVE CHARACTER ADDRESSING]\n${charLines}`);
  }

  // Previous Context
  if (params.previousContext && params.previousContext.trim()) {
    parts.push(`[PREVIOUS CHAPTER SUMMARY / CONTEXT]\n${params.previousContext.trim()}`);
  }

  // Raw Chapter Batch
  parts.push(`[RAW CHAPTERS TO TRANSLATE]\n${rawChaptersXml}`);

  return parts.join('\n\n');
}

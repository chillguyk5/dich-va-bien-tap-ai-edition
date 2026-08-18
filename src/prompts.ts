
import { BASE_TRANSLATION_IDENTITY, BASE_TRANSLATION_IDENTITY_PART_2, BASE_OUTPUT_FORMAT, METADATA_TEMPLATE, STYLE_GUIDES_TEMPLATE, SPECIFIC_RULES, GENRE_RULES_PRESETS, getSpecificRules } from './prompts/translation';
import { AUTO_ANALYZE_PROMPT, GLOSSARY_ANALYSIS_PROMPT, NAME_ANALYSIS_PROMPT, MERGE_CONTEXT_PROMPT, MERGE_GLOSSARY_PROMPT, getPronounModeOverride, getNumberUnitModeOverride } from './prompts/analysis';

// Re-export for Service usage
export { 
    AUTO_ANALYZE_PROMPT, 
    GLOSSARY_ANALYSIS_PROMPT, 
    NAME_ANALYSIS_PROMPT, 
    MERGE_CONTEXT_PROMPT, 
    MERGE_GLOSSARY_PROMPT,
    getPronounModeOverride,
    getNumberUnitModeOverride
};

// --- MAIN PROMPT CONSTRUCTION ---

// LƯU Ý QUAN TRỌNG: DEFAULT_PROMPT là prompt KHỞI TẠO của mọi phiên làm việc mới (xem
// useCoreState.ts: useState(DEFAULT_PROMPT)) — áp dụng ngay cả khi người dùng KHÔNG bấm
// "Reset Prompt" hay chạy "Tối Ưu Prompt". Trước đây hằng số này thiếu hẳn getSpecificRules()
// (mục 9-13 trong prompts/translation.ts) — tức là THIẾU mục 13 "QUY TẮC PHÂN BIỆT HỘI THOẠI
// VÀ NỘI TÂM" (quy định *nội tâm*/**hệ thống** dùng để đóng EPUB/DOCX in nghiêng/in đậm đúng
// chỗ) VÀ thiếu bullet "NHẤT QUÁN ĐƠN VỊ SỐ ĐẾM LỚN" trong mục 12 — trong khi generateBasePrompt()
// (dùng khi bấm Reset Prompt hoặc sau khi Tối Ưu Prompt) LẠI CÓ đủ 2 quy tắc này. Kết quả: người
// dùng mới/chưa từng bấm Reset hay chạy Tối Ưu Prompt sẽ dịch mà KHÔNG có 2 quy tắc quan trọng
// trên ngay từ chương đầu tiên — đây chính là nguyên nhân sâu xa gây lẫn lộn đơn vị số đếm và
// lạm dụng in nghiêng theo ngoặc kép mà người dùng phản ánh. Đã bổ sung getSpecificRules(true)
// để DEFAULT_PROMPT khớp đầy đủ nội dung với generateBasePrompt(), chỉ khác phần xưng hô theo
// thể loại (DEFAULT_PROMPT dùng preset ANCIENT tĩnh do chưa có storyInfo.genres lúc khởi tạo).
export const DEFAULT_PROMPT = `${BASE_TRANSLATION_IDENTITY}
${BASE_TRANSLATION_IDENTITY_PART_2}

${GENRE_RULES_PRESETS.ANCIENT}

${METADATA_TEMPLATE}

${STYLE_GUIDES_TEMPLATE}

${getSpecificRules(true)}

${SPECIFIC_RULES}

${BASE_OUTPUT_FORMAT}`;

export function generateBasePrompt(genres: string[] = [], settings: string[] = [], enableTitleFormatting: boolean = true): string {
    return `${BASE_TRANSLATION_IDENTITY}
${BASE_TRANSLATION_IDENTITY_PART_2}

${getPronounRules(genres, settings)}

${METADATA_TEMPLATE}

${STYLE_GUIDES_TEMPLATE}

${getSpecificRules(enableTitleFormatting)}

${SPECIFIC_RULES}

${BASE_OUTPUT_FORMAT}`;
}

export const USER_TRANSLATION_PROMPT_CONTENT = DEFAULT_PROMPT;

// --- DYNAMIC HELPERS ---

/**
 * Automatically selects the appropriate Genre Preset based on the input genres and settings.
 */
export function getPronounRules(genres: string[] = [], settings: string[] = []): string {
    const lowerGenres = (genres || []).map(g => g.toLowerCase());
    const lowerSettings = (settings || []).map(s => s.toLowerCase());
    const combined = [...lowerGenres, ...lowerSettings];
    const rules: string[] = [];

    const hasAncientSignal = combined.some(g => g.includes('tiên hiệp') || g.includes('kiếm hiệp') || g.includes('cổ đại') || g.includes('tu tiên') || g.includes('huyền huyễn') || g.includes('đông phương') || g.includes('trung cổ'));
    const hasModernSignal = combined.some(g => g.includes('đô thị') || g.includes('hiện đại') || g.includes('ngôn tình') || g.includes('hài hước') || g.includes('thanh xuân') || g.includes('80-90') || g.includes('thập niên'));

    // 1. Cổ Trang / Tiên Hiệp / Kiếm Hiệp
    if (hasAncientSignal) {
        rules.push(GENRE_RULES_PRESETS.ANCIENT);
    }

    // 2. Hiện Đại / Đô Thị / Ngôn Tình / 80-90
    if (hasModernSignal) {
         rules.push(GENRE_RULES_PRESETS.MODERN);
    }

    // 1b. HYBRID: truyện vừa có tín hiệu "đô thị/hiện đại" vừa có tín hiệu "tu tiên/tiên hiệp"
    // (VD: "Đô thị tu tiên", "Dị năng xuyên không về đô thị"). Nếu chỉ nạp MODERN, các quy tắc
    // "TUYỆT ĐỐI KHÔNG dùng ta-ngươi" sẽ ép sai nhân vật gốc tu luyện thành xưng hô đời thường,
    // đây chính là nguyên nhân bug "ta" bị đổi cứng thành "tôi". Khi cả 2 tín hiệu cùng xuất hiện,
    // bổ sung thêm hướng dẫn context-switching thay vì để 1 preset đè tuyệt đối lên preset kia.
    if (hasAncientSignal && hasModernSignal) {
        rules.push(`### V.HYBRID QUY TẮC XƯNG HÔ CHO THỂ LOẠI LAI (ĐÔ THỊ + TU TIÊN/TIÊN HIỆP)
   - Truyện này có cả yếu tố hiện đại/đô thị VÀ tu tiên/tiên hiệp. KHÔNG được chọn tuyệt đối 1 trong 2 bộ xưng hô ở trên cho toàn bộ truyện.
   - Bối cảnh/nhân vật gắn với thế giới tu luyện, tông môn, chiến đấu bằng pháp lực -> dùng xưng hô Cổ Trang (ta - ngươi, huynh - đệ...) như phần ANCIENT ở trên.
   - Bối cảnh/nhân vật gắn với đời sống đô thị hiện đại thông thường (gia đình, công sở, bạn bè ngoài đời) -> dùng xưng hô Hiện Đại (tôi - cậu, anh - em...) như phần MODERN ở trên.
   - Nếu MC vốn là người tu luyện/dị năng nhưng đang sống ở đô thị và nhất quán tự xưng "ta" như một nét tính cách xuyên suốt truyện, GIỮ NGUYÊN "ta" cho nhân vật đó kể cả khi đang ở bối cảnh đô thị, không tự ý đổi thành "tôi".`);
    }

    // 3. Võng Du / Game
    if (combined.some(g => g.includes('võng du') || g.includes('game') || g.includes('esport') || g.includes('hệ thống'))) {
        rules.push(GENRE_RULES_PRESETS.GAME);
    }

    // 4. Western / Fantasy / Phương Tây
    if (combined.some(g => g.includes('phương tây') || g.includes('fantasy') || g.includes('ma pháp') || g.includes('âu cổ') || g.includes('huyền bí') || g.includes('magic'))) {
        rules.push(GENRE_RULES_PRESETS.WESTERN);
    }

    // 5. Light Novel / Japan / Anime
    if (combined.some(g => g.includes('light novel') || g.includes('isekai') || g.includes('nhật') || g.includes('đồng nhân') || g.includes('anime'))) {
        rules.push(GENRE_RULES_PRESETS.JAPAN);
    }

    // 6. Mạt Thế / Khoa Huyễn
    if (combined.some(g => g.includes('mạt thế') || g.includes('khoa huyễn') || g.includes('zombie') || g.includes('quân sự') || g.includes('sci-fi') || g.includes('tương lai'))) {
        rules.push(GENRE_RULES_PRESETS.SCIFI);
    }

    // 7. Vô Hạn Lưu / Đa Bối Cảnh
    if (combined.some(g => g.includes('vô hạn lưu') || g.includes('xuyên nhanh') || g.includes('đa vũ trụ'))) {
        rules.push(GENRE_RULES_PRESETS.INFINITE_FLOW);
    }

    // Default fallback if nothing matches
    if (rules.length === 0) {
        rules.push(GENRE_RULES_PRESETS.ANCIENT); // Default to Ancient for safe sino-vietnamese
    }

    return rules.join('\n\n');
};

/**
 * Helper to replace variables in the template
 */
export function replacePromptVariables(template: string, info: any): string {
    if (!template) return "";
    let result = template;
    const val = (v: any) => {
        if (Array.isArray(v)) return v.join(', ');
        return v ? String(v) : 'Chưa rõ';
    };
    result = result.replace(/\{\{TITLE\}\}/g, val(info.title));
    result = result.replace(/\{\{AUTHOR\}\}/g, val(info.author));
    result = result.replace(/\{\{LANGUAGE\}\}/g, val(info.languages));
    result = result.replace(/\{\{GENRE\}\}/g, val(info.genres));
    result = result.replace(/\{\{PERSONALITY\}\}/g, val(info.mcPersonality));
    result = result.replace(/\{\{SETTING\}\}/g, val(info.worldSetting));
    result = result.replace(/\{\{FLOW\}\}/g, val(info.sectFlow));
    
    // Replace Target Audience if exists
    result = result.replace(/\{\{TARGET_AUDIENCE\}\}/g, "Độc giả Việt Nam");

    // Inject title formatting rule for old prompts if missing
    if (!result.includes("LOẠI BỎ TIỀN TỐ SỐ BÀI ĐĂNG") && result.includes("CHUẨN HÓA TIÊU ĐỀ")) {
        result = result.replace(
            "- **KHÔNG SỬA ĐỔI, THÊM THẮT TIÊU ĐỀ:**", 
            "- **LOẠI BỎ TIỀN TỐ SỐ BÀI ĐĂNG:** Nếu tiêu đề gốc có dính thêm số thứ tự bài đăng ở phía trước (VD: \"1149.第1147章\" hoặc \"596. 第594章\"), BẮT BUỘC bỏ số tiền tố đi và dịch theo đúng số chương thực sự phía sau (Dịch thành \"Chương 1147:\" hoặc \"Chương 594:\"). Tuyệt đối không dịch thành Chương 1149 hay Chương 596.\n  - **KHÔNG SỬA ĐỔI, THÊM THẮT TIÊU ĐỀ:**"
        );
    }

    return result;
};
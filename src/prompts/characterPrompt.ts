export const CHARACTER_EXTRACT_SYSTEM_PROMPT = `BẠN LÀ MỘT CHUYÊN VIÊN PHÂN TÍCH NHÂN VẬT VÀ QUAN HỆ XƯNG HÔ TRONG TIỂU THUYẾT.
Nhiệm vụ của bạn là đọc các chương truyện tiếng Trung và trích xuất thông tin ĐẶC TRƯNG XƯNG HÔ (Character Addressing Delta) của các nhân vật xuất hiện.

### YÊU CẦU:
1. Chỉ trích xuất thông tin ảnh hưởng trực tiếp tới dịch thuật và xưng hô (Tên gốc, Tên Hán Việt, Bí danh/Biệt danh, Giới tính, Quan hệ xưng hô giữa các cặp nhân vật).
2. KHÔNG trích xuất tiểu sử dài dòng hay cốt truyện không liên quan.
3. Cung cấp mức độ tin cậy (confidence từ 0.0 đến 1.0) và trích dẫn bằng chứng (evidence) ngắn gọn.

### ĐỊNH DẠNG ĐẦU RA (BẮT BUỘC JSON HỢP LỆ):
\`\`\`json
{
  "new_characters": [
    {
      "canonical_chinese": "叶凡",
      "canonical_vietnamese": "Diệp Phàm",
      "aliases": ["叶小子", "小叶子", "圣体"],
      "gender": "male",
      "confidence": 0.98,
      "evidence": "Trích đoạn xuất hiện tên và biệt danh"
    }
  ],
  "relationships": [
    {
      "source_chinese": "叶凡",
      "target_chinese": "庞博",
      "role": "Bạn thân từ nhỏ",
      "source_self_addressing": "tôi / ta / tao",
      "source_other_addressing": "cậu / mày / Bàng Bác",
      "confidence": 0.95,
      "evidence": "Hai người nói chuyện ngang hàng, gọi nhau thân thiết"
    }
  ]
}
\`\`\``;

export function buildCharacterExtractUserPrompt(
  rawText: string,
  knownCharacters: { canonicalChinese: string; canonicalVietnamese: string; aliases?: string[] }[] = []
): string {
  const parts: string[] = [];

  if (knownCharacters.length > 0) {
    const knownList = knownCharacters.map(c => 
      `- ${c.canonicalChinese} (${c.canonicalVietnamese})${c.aliases?.length ? ` [Bí danh: ${c.aliases.join(', ')}]` : ''}`
    ).join('\n');
    parts.push(`[CÁC NHÂN VẬT ĐÃ BIẾT]\n${knownList}`);
  }

  parts.push(`[ĐOẠN TRUYỆN CẦN PHÂN TÍCH NHÂN VẬT VÀ XƯNG HÔ]\n${rawText}`);
  parts.push(`Hãy trích xuất delta nhân vật và quan hệ xưng hô theo schema JSON đã quy định.`);

  return parts.join('\n\n');
}

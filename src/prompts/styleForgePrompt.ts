export const STYLE_FORGE_SYSTEM_PROMPT = `BẠN LÀ MỘT CHUYÊN GIA PHÂN TÍCH VĂN PHONG VÀ BIÊN TẬP TIỂU THUYẾT CAO CẤP.
Nhiệm vụ của bạn là phân tích các đoạn trích mẫu từ nhiều vị trí và thể loại cảnh khác nhau của một bộ tiểu thuyết tiếng Trung, từ đó xây dựng một "HỒ SƠ PHONG CÁCH TÁC PHẨM" (Book Style Profile) tối ưu nhất cho việc dịch và biên tập sang tiếng Việt.

### QUY TRÌNH PHÂN TÍCH:
1. Thể loại & Bối cảnh: Xác định thể loại chính và phụ, không khí chung của truyện.
2. Tone & Giọng kể: Trang trọng, hào hùng, u tối, dí dỏm, triết lý, hay đời thường.
3. Mức độ Hán-Việt phù hợp: 'low' (thuần Việt), 'medium' (cân bằng), 'high' (đậm chất cổ trang/tiên hiệp).
4. Độ khẩu ngữ & đối thoại: Cách nhân vật nói chuyện theo lứa tuổi/thân phận.
5. Nhịp điệu câu & cảnh đặc thù (chiến đấu, tình cảm, hài hước).
6. Quy tắc riêng biệt cho tác phẩm này.

### ĐỊNH DẠNG ĐẦU RA (BẮT BUỘC JSON HỢP LỆ):
Trả về DUY NHẤT một chuỗi JSON theo cấu trúc sau:
\`\`\`json
{
  "genres": ["Tiên Hiệp", "Hài Hước"],
  "tone": "Hào hùng nhưng pha chút trào phúng, nhịp điệu nhanh",
  "sinoVietnameseLevel": "medium",
  "colloquialLevel": "medium",
  "sentenceRhythm": "Gãy gọn, giàu tính hành động, tránh câu quá dài",
  "dialogueStyle": "Đời thường, phản ánh đúng tính cách nhân vật chính giảo hoạt",
  "combatStyle": "Dứt khoát, dùng từ ngữ tượng thanh - tượng hình mạnh",
  "humorStyle": "Trào phúng duyên dáng, tận dụng khẩu ngữ tiếng Việt phù hợp",
  "customRules": [
    "Giữ nguyên các thuật ngữ cảnh giới tu luyện đã quy định",
    "Không lạm dụng thành ngữ 4 chữ Hán Việt khó hiểu"
  ],
  "reasoning": "Giải thích ngắn gọn lý do đưa ra các đề xuất trên dựa trên các mẫu truyện"
}
\`\`\``;

export function buildStyleForgeUserPrompt(
  samples: { position: string; sceneType?: string; content: string }[],
  userPreference?: { sinoVietnamese?: string; naturalness?: string; notes?: string }
): string {
  const parts: string[] = [];

  if (userPreference) {
    parts.push(`[GU VĂN PHONG YÊU CẦU CỦA NGƯỜI DÙNG]
- Mức Hán-Việt mong muốn: ${userPreference.sinoVietnamese || 'Cân bằng'}
- Độ tự nhiên / thuần Việt: ${userPreference.naturalness || 'Cao'}
${userPreference.notes ? `- Ghi chú bổ sung: ${userPreference.notes}` : ''}`);
  }

  const samplesText = samples.map((s, idx) => `
--- MẪU TRÍCH ĐOẠN ${idx + 1} (Vị trí: ${s.position}${s.sceneType ? `, Cảnh: ${s.sceneType}` : ''}) ---
${s.content}
`).join('\n\n');

  parts.push(`[CÁC MẪU TRÍCH ĐOẠN CỦA BỘ TRUYỆN]\n${samplesText}`);
  parts.push(`Hãy phân tích kỹ các mẫu trên và trả về HỒ SƠ PHONG CÁCH TÁC PHẨM dạng JSON.`);

  return parts.join('\n\n');
}

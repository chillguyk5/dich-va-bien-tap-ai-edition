import { FewShotExample, FewShotTag } from '../../types';

export const INITIAL_FEW_SHOT_POOL: FewShotExample[] = [
  {
    id: 'sample-combat-1',
    title: 'Cảnh chiến đấu kiếm khí',
    tags: ['combat', 'narration'],
    sourceChinese: '林凡手中长剑一震，剑鸣之声彻响九霄，一道惊天剑气呼啸而出，瞬间将前方数名黑衣人尽数斩杀。',
    draftVietnamese: 'Lâm Phàm trong tay trường kiếm rung lên, tiếng kiếm kêu vang vọng cửu tiêu, một đạo kinh thiên kiếm khí gào thét mà ra, trong nháy mắt đem phía trước mấy tên hắc y nhân đều chém giết.',
    finalVietnamese: 'Lâm Phàm vung nhẹ trường kiếm, tiếng kiếm ngân vang rền khắp chín tầng mây. Một luồng kiếm khí kinh thiên xé gió lao vút đi, chém rạp toàn bộ đám người bịt mặt phía trước trong chớp mắt.',
    explanation: 'Khử cấu trúc "trong tay", "đem... đều chém giết", làm mượt các động từ hành động và tăng tính uy lực.',
  },
  {
    id: 'sample-dialogue-1',
    title: 'Đối thoại kịch tính',
    tags: ['dialogue'],
    sourceChinese: '“你……你竟然敢杀我赵家的人？你难道不知道我赵家在青阳城的势力吗？！”赵天龙脸色惨白地吼道。',
    draftVietnamese: '"Ngươi... Ngươi dĩ nhiên dám giết người của Triệu gia ta? Ngươi chẳng lẽ không biết thế lực của Triệu gia ta ở Thanh Dương Thành sao?!" Triệu Thiên Long sắc mặt trắng bệch mà rống to nói.',
    finalVietnamese: '"Mày... Mày dám giết người của Triệu gia? Mày không biết thế lực của Triệu gia tao ở thành Thanh Dương này lớn cỡ nào à?!" Triệu Thiên Long mặt cắt không còn giọt máu, gào lên giận dữ.',
    explanation: 'Biến câu thoại dịch cứng nhắc thành khẩu ngữ tự nhiên, thể hiện rõ sự phẫn nộ và run sợ của nhân vật phản diện.',
  }
];

export function retrieveFewShotsForTask(
  pool: FewShotExample[],
  targetTags: FewShotTag[] = ['general'],
  maxCount: number = 2
): FewShotExample[] {
  if (!pool || pool.length === 0) return [];
  if (targetTags.length === 0 || targetTags.includes('general')) {
    return pool.slice(0, maxCount);
  }

  // Score each example by number of matching tags
  const scored = pool.map(ex => {
    const matchCount = ex.tags.filter(t => targetTags.includes(t)).length;
    return { example: ex, score: matchCount };
  });

  // Sort by match score descending
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, maxCount).map(s => s.example);
}

export function detectSceneTags(text: string): FewShotTag[] {
  const tags: Set<FewShotTag> = new Set();
  if (!text) return ['general'];

  // Check dialogue frequency
  const dialogueQuotes = (text.match(/["“][^"”]{3,}["”]/g) || []).length;
  if (dialogueQuotes > 5) {
    tags.add('dialogue');
  }

  // Check combat keywords
  if (/\b(kiếm|đao|chưởng|quyền|linh lực|pháp bảo|sát ý|ầm ầm|nổ tung|huyết vụ|giao thủ|chiến đấu)\b/i.test(text)) {
    tags.add('combat');
  }

  // Check romance / emotional keywords
  if (/\b(dịu dàng|ánh mắt|mỉm cười|nắm tay|ôm|rung động|tình ý|má đỏ)\b/i.test(text)) {
    tags.add('romance');
  }

  // Check comedy
  if (/\b(dở khóc dở cười|ngớ người|khóe miệng co giật|dở hơi|cười ha ha)\b/i.test(text)) {
    tags.add('comedy');
  }

  return tags.size > 0 ? Array.from(tags) : ['general'];
}

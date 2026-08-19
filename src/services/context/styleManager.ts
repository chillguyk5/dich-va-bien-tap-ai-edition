import { BookStyleProfile, FileItem } from '../../types';

export const DEFAULT_BOOK_STYLE: BookStyleProfile = {
  version: '1',
  genres: ['Tiên Hiệp'],
  tone: 'Mạch lạc, lưu loát, giữ không khí trang trọng pha chút phóng khoáng',
  sinoVietnameseLevel: 'medium',
  colloquialLevel: 'medium',
  sentenceRhythm: 'Gãy gọn, nhịp điệu nhanh trong cảnh hành động, mềm mại trong tự sự',
  dialogueStyle: 'Sống động, đúng thân phận và vai vế nhân vật',
  combatStyle: 'Dứt khoát, giàu tính hình tượng và thanh thế',
  humorStyle: 'Duyên dáng, tự nhiên',
  customRules: [],
  isFrozen: false,
};

export interface StyleSampleExcerpt {
  position: 'start' | 'middle' | 'end';
  sceneType?: string;
  chapterIndex: number;
  content: string;
}

/**
 * Picks 5-15 diverse samples across the novel: start, middle, end, capturing different scene styles.
 */
export function extractNovelStyleSamples(files: FileItem[], maxSamples: number = 10): StyleSampleExcerpt[] {
  if (!files || files.length === 0) return [];
  const samples: StyleSampleExcerpt[] = [];
  const total = files.length;

  const takeSlice = (startIdx: number, count: number, pos: 'start' | 'middle' | 'end') => {
    for (let i = startIdx; i < Math.min(startIdx + count, total); i++) {
      if (samples.length >= maxSamples) break;
      const file = files[i];
      if (file.content && file.content.trim().length > 200) {
        // Take ~1000 chars excerpt
        const excerpt = file.content.slice(0, 1500).trim();
        samples.push({
          position: pos,
          chapterIndex: i + 1,
          content: excerpt,
        });
      }
    }
  };

  const sampleCountEach = Math.max(1, Math.floor(maxSamples / 3));

  // 1. Start chapters
  takeSlice(0, sampleCountEach, 'start');

  // 2. Middle chapters
  const midStart = Math.max(0, Math.floor(total / 2) - Math.floor(sampleCountEach / 2));
  takeSlice(midStart, sampleCountEach, 'middle');

  // 3. End chapters
  const endStart = Math.max(0, total - sampleCountEach);
  takeSlice(endStart, sampleCountEach, 'end');

  return samples;
}

export function createNextStyleVersion(current: BookStyleProfile, newProfileData: Partial<BookStyleProfile>): BookStyleProfile {
  const currentVer = parseInt(current.version || '1', 10) || 1;
  return {
    ...current,
    ...newProfileData,
    version: `${currentVer + 1}`,
    isFrozen: false,
    lastCalibrated: new Date().toISOString(),
  };
}

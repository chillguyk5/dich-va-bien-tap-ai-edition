
export enum FileStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  TRANSLATING = 'TRANSLATING',
  TRANSLATED = 'TRANSLATED',
  REVIEWING = 'REVIEWING',
  REVIEWED = 'REVIEWED',
  EDITING = 'EDITING',
  EDITED = 'EDITED',
  QA_CHECKING = 'QA_CHECKING',
  QA_REPAIRING = 'QA_REPAIRING',
  REPAIRING = 'REPAIRING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export type TranslationTier = 'flash' | 'normal' | 'pro' | 'full' | 'lite' | 'openrouter' | 'deepseek';

export type TaskType = 
  | 'translate'
  | 'review'
  | 'edit'
  | 'qa_repair'
  | 'style_forge'
  | 'character_extract'
  | 'title';

export type EditorRawMode = 'hybrid' | 'no_raw' | 'full_raw';

export type PronounMode = 'convert' | 'natural' | 'hybrid';

export interface BatchLimits {
  latin: { v36: number; v35: number; v31: number; v3: number; v25: number; maxTotalChars: number };
  complex: { v36: number; v35: number; v31: number; v3: number; v25: number; maxTotalChars: number };
}

export interface RatioLimits {
  vn: { min: number; max: number };
  en: { min: number; max: number };
  krjp: { min: number; max: number };
  cn: { min: number; max: number };
}

// --- REVIEWER TYPES ---
export type ReviewIssueType = 
  | 'mistranslation'
  | 'omission'
  | 'addition'
  | 'character_name'
  | 'terminology'
  | 'pronoun'
  | 'style'
  | 'awkward'
  | 'other';

export type ReviewSeverity = 'critical' | 'major' | 'minor' | 'style' | 'suggestion';

export interface ReviewIssue {
  issueId: string;
  type: ReviewIssueType;
  severity: ReviewSeverity;
  sourceSpan?: string;
  translationSpan?: string;
  explanation: string;
  suggestedFix?: string;
  confidence: number; // 0 to 1
}

export interface ChapterReviewReport {
  chapterId: string;
  score: number; // 0 to 10
  confidence: number; // 0 to 1
  action: 'pass' | 'edit' | 'retranslate';
  summary?: string;
  issues: ReviewIssue[];
}

// --- BOOK STYLE PROFILE ---
export interface BookStyleProfile {
  version: string; // 'v1', 'v2'
  genres: string[];
  tone: string;
  sinoVietnameseLevel: 'low' | 'medium' | 'high';
  colloquialLevel: 'low' | 'medium' | 'high';
  sentenceRhythm: string;
  dialogueStyle: string;
  combatStyle: string;
  humorStyle: string;
  customRules: string[];
  isFrozen: boolean;
  lastCalibrated?: string;
}

// --- PRONOUN PROFILE ---
export interface PronounProfile {
  mode: PronounMode;
  lexicalRules: Record<string, string>; // e.g. { "本座": "bản tọa", "老夫": "lão phu" }
  narrationRules: Record<string, string>; // e.g. { "male": "hắn", "female": "nàng" }
  addressingPolicy: 'strict' | 'contextual';
}

// --- FEW-SHOT POOL ---
export type FewShotTag = 
  | 'dialogue'
  | 'combat'
  | 'romance'
  | 'narration'
  | 'comedy'
  | 'inner_monologue'
  | 'exposition'
  | 'general';

export interface FewShotExample {
  id: string;
  title: string;
  tags: FewShotTag[];
  sourceChinese: string;
  draftVietnamese: string;
  finalVietnamese: string;
  explanation?: string;
  createdAt?: string;
}

// --- CHARACTER ADDRESSING CONTEXT ---
export interface CharacterAddressingEntry {
  id: string;
  canonicalChinese: string;
  canonicalVietnamese: string;
  aliases: string[];
  gender?: 'male' | 'female' | 'other';
  relationships: Record<string, { role: string; selfAddressing: string; otherAddressing: string }>;
  confidence: number;
}

export interface CharacterAddressingContext {
  characters: CharacterAddressingEntry[];
}

// --- PIPELINE CONFIG ---
export interface PipelineConfig {
  translationBatchTargetChars: number; // default ~10000
  reviewBatchTargetChars: number; // default ~20000
  editorRawMode: EditorRawMode; // default 'hybrid'
  hybridContextLines: number; // default 2
  editorFewShotCount: number; // default 2
  autoSkipEditorIfPass: boolean; // default false
  editorPassScoreThreshold: number; // default 9.0
  taskModels: {
    translate: string;
    review: string;
    edit: string;
    qa_repair: string;
    style_forge: string;
    character_extract: string;
    title: string;
  };
}

// --- FILE / CHAPTER ITEM ---
export interface FileItem {
  id: string;
  name: string;
  content: string; // Source Chinese
  translatedContent: string | null; // Final / active Vietnamese text
  status: FileStatus;
  errorMessage?: string;
  retryCount: number;
  originalCharCount: number;
  remainingRawCharCount: number;
  usedModel?: string;
  processingDuration?: number;
  integrityRatio?: number;
  isFragmentedSource?: boolean;
  integrityOverrideAccepted?: boolean;
  ratioWarning?: string;
  titleGeneratedByAI?: boolean;
  chapterFormat?: 'titled' | 'numbered' | 'untitled';
  hasStaleTranslation?: boolean;

  // Multi-stage pipeline storage
  draftTranslation?: string;
  draftModel?: string;
  reviewReport?: ChapterReviewReport;
  reviewModel?: string;
  editedTranslation?: string;
  editedModel?: string;
  finalTranslation?: string;
  resolvedIssueIds?: string[];
  unresolvedIssueIds?: string[];
  qaIssues?: string[];
}

export interface ProcessingStats {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  processing: number;
}

export interface ContextPreset {
  id: string;
  name: string;
  content: string;
}

export interface StoryInfo {
  title: string;
  author: string;
  languages: string[];
  genres: string[];
  mcPersonality: string[];
  worldSetting: string[];
  sectFlow: string[];
  contextNotes?: string;
  summary?: string;
  imagePrompt?: string;
  additionalRules?: string;
  pronounMode?: PronounMode;
  numberUnitMode?: 'modern' | 'ancient' | 'flexible';
  enableTitleFormatting?: boolean;
  enableAutoFormat?: boolean;
  enableGarbageCleanOnImport?: boolean;
  titleFormat?: 'colon' | 'dash' | 'newline' | 'bracket';
  tagFormat?: 'auto' | 'bracket' | 'xml';
  translator?: string;
  publisher?: string;
}

export interface EpubDesignOptions {
  chapterIconPosition: 'top' | 'inline' | 'bottom';
  iconHeight: number;
  enableDropCaps: boolean;
  dropCapLines: number;
  dividerOrnament: string;
  dividerIconWidth: number;
  chapterTextAlign: 'left' | 'center' | 'right';
  lineHeight: number;
  paragraphSpacing: number;
  indentFirstLine: boolean;
  hyphenation: boolean;
  enableCoverPage: boolean;
  enableTitlePage: boolean;
  titlePageStyle: 'classic' | 'modern' | 'minimal';
}

export const DEFAULT_EPUB_DESIGN_OPTIONS: EpubDesignOptions = {
  chapterIconPosition: 'top',
  iconHeight: 4,
  enableDropCaps: false,
  dropCapLines: 3,
  dividerOrnament: '❧',
  dividerIconWidth: 5,
  chapterTextAlign: 'center',
  lineHeight: 1.5,
  paragraphSpacing: 1.5,
  indentFirstLine: true,
  hyphenation: false,
  enableCoverPage: false,
  enableTitlePage: false,
  titlePageStyle: 'classic',
};

export interface EpubDesignAssets {
  titleFont: File | null;
  contentFont: File | null;
  chapterIcon: File | null;
  dividerIcon: File | null;
}

export const EMPTY_EPUB_DESIGN_ASSETS: EpubDesignAssets = {
  titleFont: null,
  contentFont: null,
  chapterIcon: null,
  dividerIcon: null,
};

export interface ModelQuota {
  id: string;
  name: string;
  rpmLimit: number;
  rpdLimit: number;
  priority: number;
}

export interface ModelUsage {
  requestsToday: number;
  lastResetDate: string;
  recentRequests: number[];
  cooldownUntil: number;
  isDepleted: boolean;
  consecutiveErrors: number;
  consecutiveQuotaErrors?: number;
}

// --- SHARED UI TYPES ---
export interface Toast { 
  id: string; 
  message: string; 
  type: 'success' | 'error' | 'info' | 'warning'; 
}

export interface LogEntry { 
  id: string; 
  timestamp: Date; 
  message: string; 
  type: 'success' | 'error' | 'info'; 
}

export interface GlobalRepairEntry { 
  fileId: string; 
  lineIndex: number; 
  originalLine: string; 
}


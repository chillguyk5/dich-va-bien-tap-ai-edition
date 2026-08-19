import React, { useState } from 'react';
import {
  BookA, BookOpen, Download, Upload, Microscope, Loader2,
  Zap, Wrench, RefreshCw, Eye, EyeOff, Lock, Unlock, CheckCircle2,
  Sparkles, Users, MessageSquare, Tag, Plus, Trash2, Edit3, ShieldAlert
} from 'lucide-react';
import { 
  BookStyleProfile, PronounProfile, CharacterAddressingContext, 
  FewShotExample, FewShotTag, StoryInfo, PronounMode 
} from '../types';
import { GlossaryTable } from './GlossaryTable';
import { extractNovelStyleSamples, createNextStyleVersion } from '../services/context/styleManager';
import { executeTaskInference } from '../services/inference/providerManager';
import { STYLE_FORGE_SYSTEM_PROMPT, buildStyleForgeUserPrompt } from '../prompts/styleForgePrompt';

export interface KnowledgePageExtendedProps {
  storyInfo: StoryInfo;
  setStoryInfo: React.Dispatch<React.SetStateAction<StoryInfo>>;
  additionalDictionary: string;
  setAdditionalDictionary: (v: string) => void;
  dictTab: 'custom' | 'default';
  setDictTab: (v: 'custom' | 'default') => void;
  handleDictionaryDownload: () => void;
  handleDictionaryUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDictionaryEnforce?: () => void;

  bookStyle?: BookStyleProfile;
  setBookStyle?: React.Dispatch<React.SetStateAction<BookStyleProfile>>;

  pronounProfile?: PronounProfile;
  setPronounProfile?: React.Dispatch<React.SetStateAction<PronounProfile>>;

  characterAddressing?: CharacterAddressingContext;
  setCharacterAddressing?: React.Dispatch<React.SetStateAction<CharacterAddressingContext>>;

  fewShotPool?: FewShotExample[];
  setFewShotPool?: React.Dispatch<React.SetStateAction<FewShotExample[]>>;

  files?: any[];
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const KnowledgePage: React.FC<KnowledgePageExtendedProps> = (props) => {
  const [activeSubTab, setActiveSubTab] = useState<'glossary' | 'pronouns' | 'style' | 'fewshots' | 'characters'>('glossary');
  const [isForgingStyle, setIsForgingStyle] = useState(false);

  // New Few-Shot Form State
  const [showAddFewShot, setShowAddFewShot] = useState(false);
  const [newFewShotTitle, setNewFewShotTitle] = useState('');
  const [newFewShotTags, setNewFewShotTags] = useState<FewShotTag[]>(['general']);
  const [newFewShotSource, setNewFewShotSource] = useState('');
  const [newFewShotDraft, setNewFewShotDraft] = useState('');
  const [newFewShotFinal, setNewFewShotFinal] = useState('');

  // AI Style Calibration Handler
  const handleRunStyleCalibration = async () => {
    if (!props.files || props.files.length === 0) {
      props.addToast('Vui lòng thêm ít nhất một vài chương truyện để AI lấy mẫu phân tích.', 'warning');
      return;
    }

    setIsForgingStyle(true);
    try {
      const samples = extractNovelStyleSamples(props.files, 12);
      const userPrompt = buildStyleForgeUserPrompt(samples, {
        sinoVietnamese: props.bookStyle?.sinoVietnameseLevel,
        naturalness: props.bookStyle?.colloquialLevel,
        notes: props.storyInfo?.contextNotes,
      });

      props.addToast('Đang gọi AI Pro phân tích 12 mẫu trích đoạn...', 'info');
      const result = await executeTaskInference(
        'style_forge',
        STYLE_FORGE_SYSTEM_PROMPT,
        userPrompt,
        { jsonOutput: true, taskName: 'AI Xây Dựng Phong Cách Tác Phẩm' }
      );

      let cleanJson = result.text.trim();
      if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      }

      const parsed = JSON.parse(cleanJson);
      if (props.setBookStyle && props.bookStyle) {
        const nextStyle = createNextStyleVersion(props.bookStyle, {
          genres: parsed.genres || props.bookStyle.genres,
          tone: parsed.tone || props.bookStyle.tone,
          sinoVietnameseLevel: parsed.sinoVietnameseLevel || props.bookStyle.sinoVietnameseLevel,
          colloquialLevel: parsed.colloquialLevel || props.bookStyle.colloquialLevel,
          sentenceRhythm: parsed.sentenceRhythm || props.bookStyle.sentenceRhythm,
          dialogueStyle: parsed.dialogueStyle || props.bookStyle.dialogueStyle,
          combatStyle: parsed.combatStyle || props.bookStyle.combatStyle,
          humorStyle: parsed.humorStyle || props.bookStyle.humorStyle,
          customRules: parsed.customRules || props.bookStyle.customRules,
        });
        props.setBookStyle(nextStyle);
        props.addToast(`Đã tạo thành công Book Style Profile v${nextStyle.version}!`, 'success');
      }
    } catch (e: any) {
      props.addToast(`Lỗi phân tích phong cách: ${e.message}`, 'error');
    } finally {
      setIsForgingStyle(false);
    }
  };

  // Add Few Shot to Pool
  const handleSaveNewFewShot = () => {
    if (!newFewShotSource.trim() || !newFewShotFinal.trim()) {
      props.addToast('Vui lòng nhập cả câu gốc và câu biên tập hoàn chỉnh.', 'warning');
      return;
    }

    const newExample: FewShotExample = {
      id: `fewshot-${Date.now()}`,
      title: newFewShotTitle || `Mẫu biên tập ${Date.now()}`,
      tags: newFewShotTags,
      sourceChinese: newFewShotSource.trim(),
      draftVietnamese: newFewShotDraft.trim(),
      finalVietnamese: newFewShotFinal.trim(),
      createdAt: new Date().toISOString(),
    };

    if (props.setFewShotPool && props.fewShotPool) {
      props.setFewShotPool([...props.fewShotPool, newExample]);
    }
    setShowAddFewShot(false);
    setNewFewShotTitle('');
    setNewFewShotSource('');
    setNewFewShotDraft('');
    setNewFewShotFinal('');
    props.addToast('Đã thêm mẫu biên tập vào Few-Shot Pool!', 'success');
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto flex flex-col gap-4 h-full animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
      {/* 1. SUB-TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 shrink-0 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveSubTab('glossary')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'glossary'
              ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 ring-1 ring-amber-300 dark:ring-amber-800 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookA className="w-4 h-4" /> Từ Điển (Glossary)
        </button>

        <button
          onClick={() => setActiveSubTab('pronouns')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'pronouns'
              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-300 dark:ring-emerald-800 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> Đại Từ (Pronouns)
        </button>

        <button
          onClick={() => setActiveSubTab('style')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'style'
              ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 ring-1 ring-purple-300 dark:ring-purple-800 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" /> Văn Phong (Book Style)
        </button>

        <button
          onClick={() => setActiveSubTab('fewshots')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'fewshots'
              ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 ring-1 ring-sky-300 dark:ring-sky-800 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Tag className="w-4 h-4" /> Mẫu Biên Tập (Few-Shot)
        </button>

        <button
          onClick={() => setActiveSubTab('characters')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'characters'
              ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 ring-1 ring-rose-300 dark:ring-rose-800 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" /> Xưng Hô Nhân Vật (Addressing)
        </button>
      </div>

      {/* 2. SUB-TAB CONTENT PANELS */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        {/* TAB 1: GLOSSARY */}
        {activeSubTab === 'glossary' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-elevation-1 border border-slate-200 dark:border-slate-800 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <BookA className="w-4 h-4 text-amber-500" /> Từ Điển Riêng (Canonical Glossary)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Các từ khóa, danh từ riêng, thuật ngữ locked (chỉ inject khi xuất hiện trong batch).
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={props.handleDictionaryDownload}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-900/30 text-slate-600 dark:text-slate-300 hover:text-amber-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5" /> Tải về
                </button>
                <label className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all">
                  <Upload className="w-3.5 h-3.5" /> Thêm file .txt
                  <input type="file" accept=".txt" className="hidden" onChange={props.handleDictionaryUpload} />
                </label>
              </div>
            </div>

            <textarea
              className="flex-1 w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 font-mono text-xs text-slate-700 dark:text-slate-300 resize-none outline-none focus:ring-2 focus:ring-amber-400 leading-relaxed custom-scrollbar"
              placeholder="Nhập theo định dạng:&#10;叶凡 = Diệp Phàm&#10;青阳城 = thành Thanh Dương&#10;玄天剑 = Huyền Thiên Kiếm"
              value={props.additionalDictionary || ''}
              onChange={e => props.setAdditionalDictionary(e.target.value)}
            />
          </div>
        )}

        {/* TAB 2: PRONOUNS */}
        {activeSubTab === 'pronouns' && props.pronounProfile && props.setPronounProfile && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-elevation-1 border border-slate-200 dark:border-slate-800 flex flex-col gap-5">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-500" /> Cấu Hình Đại Từ (Pronoun Profile)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Chọn chế độ xưng hô và tùy biến bảng ánh xạ đại từ (Convert, Natural, Hybrid).
              </p>
            </div>

            {/* Pronoun Mode Selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div
                onClick={() => props.setPronounProfile!({ ...props.pronounProfile!, mode: 'convert' })}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  props.pronounProfile.mode === 'convert'
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-400/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-100">1. Convert Mode</span>
                  {props.pronounProfile.mode === 'convert' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </div>
                <p className="text-xs text-slate-500">
                  Xưng hô chuẩn phong cách Hán Việt / Tiên Hiệp (ta - ngươi, hắn - nàng, sư huynh - sư muội, bản tọa).
                </p>
              </div>

              <div
                onClick={() => props.setPronounProfile!({ ...props.pronounProfile!, mode: 'hybrid' })}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  props.pronounProfile.mode === 'hybrid'
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-400/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-100">2. Hybrid Mode (Khuyên dùng)</span>
                  {props.pronounProfile.mode === 'hybrid' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </div>
                <p className="text-xs text-slate-500">
                  Tự sự (narration) giữ hắn/nàng/bản tọa, nhưng hội thoại (dialogue) áp dụng xưng hô tự nhiên theo quan hệ.
                </p>
              </div>

              <div
                onClick={() => props.setPronounProfile!({ ...props.pronounProfile!, mode: 'natural' })}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  props.pronounProfile.mode === 'natural'
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-400/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-100">3. Natural Mode</span>
                  {props.pronounProfile.mode === 'natural' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </div>
                <p className="text-xs text-slate-500">
                  Thuần Việt hóa tối đa (tôi - cậu, anh - em, mình), phù hợp truyện hiện đại, đô thị, học đường.
                </p>
              </div>
            </div>

            {/* Lexical Rules Editor */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Bảng Quy Tắc Ánh Xạ Đại Từ (Lexical Rules):
              </label>
              <textarea
                rows={10}
                className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 font-mono text-xs text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-emerald-400 leading-relaxed custom-scrollbar"
                value={Object.entries(props.pronounProfile.lexicalRules || {}).map(([k, v]) => `${k} = ${v}`).join('\n')}
                onChange={e => {
                  const lines = e.target.value.split('\n');
                  const newRules: Record<string, string> = {};
                  lines.forEach(l => {
                    const [k, v] = l.split('=').map(s => s.trim());
                    if (k && v) newRules[k] = v;
                  });
                  props.setPronounProfile!({ ...props.pronounProfile!, lexicalRules: newRules });
                }}
              />
            </div>
          </div>
        )}

        {/* TAB 3: BOOK STYLE */}
        {activeSubTab === 'style' && props.bookStyle && props.setBookStyle && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-elevation-1 border border-slate-200 dark:border-slate-800 flex flex-col gap-5">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" /> Hồ Sơ Phong Cách Tác Phẩm (Book Style v{props.bookStyle.version})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Định hình giọng văn, mức Hán-Việt, nhịp câu và phong cách riêng biệt cho toàn bộ tác phẩm.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => props.setBookStyle!({ ...props.bookStyle!, isFrozen: !props.bookStyle!.isFrozen })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    props.bookStyle.isFrozen
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {props.bookStyle.isFrozen ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  {props.bookStyle.isFrozen ? 'Đã Khóa Phong Cách (Frozen)' : 'Mở Khóa'}
                </button>

                <button
                  onClick={handleRunStyleCalibration}
                  disabled={isForgingStyle || props.bookStyle.isFrozen}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                >
                  {isForgingStyle ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Microscope className="w-3.5 h-3.5" />}
                  AI Trích Xuất Văn Phong (Pro)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Giọng Văn Chủ Đạo (Tone):</label>
                <input
                  type="text"
                  disabled={props.bookStyle.isFrozen}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-purple-400"
                  value={props.bookStyle.tone || ''}
                  onChange={e => props.setBookStyle!({ ...props.bookStyle!, tone: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Nhịp Điệu Câu (Sentence Rhythm):</label>
                <input
                  type="text"
                  disabled={props.bookStyle.isFrozen}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-purple-400"
                  value={props.bookStyle.sentenceRhythm || ''}
                  onChange={e => props.setBookStyle!({ ...props.bookStyle!, sentenceRhythm: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Phong Cách Thoại (Dialogue Style):</label>
                <input
                  type="text"
                  disabled={props.bookStyle.isFrozen}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-purple-400"
                  value={props.bookStyle.dialogueStyle || ''}
                  onChange={e => props.setBookStyle!({ ...props.bookStyle!, dialogueStyle: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Cảnh Hành Động / Chiến Đấu:</label>
                <input
                  type="text"
                  disabled={props.bookStyle.isFrozen}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-purple-400"
                  value={props.bookStyle.combatStyle || ''}
                  onChange={e => props.setBookStyle!({ ...props.bookStyle!, combatStyle: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: FEW-SHOT POOL */}
        {activeSubTab === 'fewshots' && props.fewShotPool && props.setFewShotPool && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-elevation-1 border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-sky-500" /> Mẫu Biên Tập Mẫu (Few-Shot Pool)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Các đoạn văn trước và sau khi bạn biên tập tay để AI Editor học giọng văn chuẩn nhất.
                </p>
              </div>

              <button
                onClick={() => setShowAddFewShot(true)}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm Mẫu Mới
              </button>
            </div>

            {/* Modal Add Few Shot */}
            {showAddFewShot && (
              <div className="bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/60 rounded-2xl p-4 flex flex-col gap-3">
                <h4 className="text-xs font-bold text-sky-700 dark:text-sky-300">Tạo Ví Dụ Biên Tập Mẫu:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Tiêu đề mẫu (vd: Cảnh hành động kiếm khí)"
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none"
                    value={newFewShotTitle}
                    onChange={e => setNewFewShotTitle(e.target.value)}
                  />
                  <div className="flex gap-1 items-center">
                    <span className="text-xs text-slate-400">Tag:</span>
                    {(['combat', 'dialogue', 'romance', 'comedy', 'narration'] as FewShotTag[]).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setNewFewShotTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                          newFewShotTags.includes(t)
                            ? 'bg-sky-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <textarea
                    rows={4}
                    placeholder="Câu tiếng Trung gốc..."
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs outline-none"
                    value={newFewShotSource}
                    onChange={e => setNewFewShotSource(e.target.value)}
                  />
                  <textarea
                    rows={4}
                    placeholder="Bản dịch thô (Draft)..."
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs outline-none"
                    value={newFewShotDraft}
                    onChange={e => setNewFewShotDraft(e.target.value)}
                  />
                  <textarea
                    rows={4}
                    placeholder="Bản đã biên tập chuẩn (Final)..."
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs outline-none"
                    value={newFewShotFinal}
                    onChange={e => setNewFewShotFinal(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowAddFewShot(false)}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSaveNewFewShot}
                    className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold"
                  >
                    Lưu Mẫu
                  </button>
                </div>
              </div>
            )}

            {/* List of Examples */}
            <div className="flex flex-col gap-3">
              {props.fewShotPool.map((ex) => (
                <div
                  key={ex.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col gap-2"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{ex.title}</span>
                      <div className="flex gap-1">
                        {ex.tags.map(t => (
                          <span key={t} className="px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 text-[10px] font-bold">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        props.setFewShotPool!(props.fewShotPool!.filter(x => x.id !== ex.id));
                        props.addToast('Đã xóa mẫu biên tập.', 'info');
                      }}
                      className="text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Draft:</span>
                      <p className="text-slate-600 dark:text-slate-400 mt-1">{ex.draftVietnamese}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-emerald-500 uppercase">Final Editor:</span>
                      <p className="text-slate-800 dark:text-slate-100 mt-1 font-medium">{ex.finalVietnamese}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: CHARACTER ADDRESSING */}
        {activeSubTab === 'characters' && props.characterAddressing && props.setCharacterAddressing && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-elevation-1 border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-rose-500" /> Bảng Xưng Hô & Quan Hệ Nhân Vật
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Quản lý tên Hán - Việt, bí danh (alias) và cách xưng hô theo từng cặp quan hệ (tự động cập nhật delta khi dịch).
              </p>
            </div>

            {props.characterAddressing.characters.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                Chưa có dữ liệu nhân vật. Hệ thống sẽ tự động trích xuất các nhân vật chính và xưng hô khi dịch các chương đầu.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {props.characterAddressing.characters.map((char) => (
                  <div
                    key={char.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                          {char.canonicalChinese} → {char.canonicalVietnamese}
                        </span>
                        {char.aliases && char.aliases.length > 0 && (
                          <span className="text-xs text-slate-400">
                            (Bí danh: {char.aliases.join(', ')})
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          props.setCharacterAddressing!({
                            characters: props.characterAddressing!.characters.filter(c => c.id !== char.id),
                          });
                        }}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {char.relationships && Object.keys(char.relationships).length > 0 && (
                      <div className="text-xs text-slate-600 dark:text-slate-400 flex flex-col gap-1 pl-2 border-l-2 border-rose-300">
                        {Object.entries(char.relationships).map(([target, rel]) => (
                          <div key={target}>
                            * Với <strong>{target}</strong>: xưng <em>"{rel.selfAddressing}"</em>, gọi <em>"{rel.otherAddressing}"</em> ({rel.role})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

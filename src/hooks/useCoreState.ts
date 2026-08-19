/* eslint-disable react-hooks/immutability, react-hooks/set-state-in-effect, react-hooks/preserve-manual-memoization */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  StoryInfo, FileItem, ModelQuota, BatchLimits, RatioLimits,
  BookStyleProfile, PronounProfile, CharacterAddressingContext, FewShotExample, PipelineConfig
} from '../types';
import { DEFAULT_PROMPT, MODEL_CONFIGS } from '../constants';
import { DEFAULT_RATIO_LIMITS } from '../constants/ratioLimits';
import { DEFAULT_BOOK_STYLE } from '../services/context/styleManager';
import { DEFAULT_PRONOUN_PROFILE } from '../services/context/pronounResolver';
import { INITIAL_CHARACTER_CONTEXT } from '../services/context/characterAddressingManager';
import { INITIAL_FEW_SHOT_POOL } from '../services/context/fewShotRetriever';
import { DEFAULT_TASK_MODELS } from '../services/inference/taskRouter';
import { loadFromStorage, saveToStorage, clearDatabase } from '../utils/storage';
import { quotaManager } from '../utils/quotaManager';
import { base64ToFile, fileToBase64 } from '../utils/fileHelpers';
import { createSafeSetter } from './coreState/createSafeSetter';

const STORAGE_KEY = 'current_session_v1';

export const initialStoryInfo: StoryInfo = { 
  title: '', author: '', languages: ['Tiếng Trung'], genres: ['Tiên Hiệp'], 
  mcPersonality: [], worldSetting: [], sectFlow: [], contextNotes: '', summary: '', additionalRules: '',
  enableTitleFormatting: true, enableAutoFormat: true, tagFormat: 'auto',
  pronounMode: 'hybrid',
};

export const initialPipelineConfig: PipelineConfig = {
  translationBatchTargetChars: 10000,
  reviewBatchTargetChars: 20000,
  editorRawMode: 'hybrid',
  hybridContextLines: 2,
  editorFewShotCount: 2,
  autoSkipEditorIfPass: false,
  editorPassScoreThreshold: 9.0,
  taskModels: {
    translate: DEFAULT_TASK_MODELS.translate[0],
    review: DEFAULT_TASK_MODELS.review[0],
    edit: DEFAULT_TASK_MODELS.edit[0],
    qa_repair: DEFAULT_TASK_MODELS.qa_repair[0],
    style_forge: DEFAULT_TASK_MODELS.style_forge[0],
    character_extract: DEFAULT_TASK_MODELS.character_extract[0],
    title: DEFAULT_TASK_MODELS.title[0],
  },
};

export const useCoreState = (addToast: (msg: string, type: 'success'|'error'|'info' | 'warning') => void) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [storyInfo, setStoryInfo] = useState<StoryInfo>(initialStoryInfo);
  const [bookStyle, setBookStyle] = useState<BookStyleProfile>(DEFAULT_BOOK_STYLE);
  const [pronounProfile, setPronounProfile] = useState<PronounProfile>(DEFAULT_PRONOUN_PROFILE);
  const [characterAddressing, setCharacterAddressing] = useState<CharacterAddressingContext>(INITIAL_CHARACTER_CONTEXT);
  const [fewShotPool, setFewShotPool] = useState<FewShotExample[]>(INITIAL_FEW_SHOT_POOL);
  const [pipelineConfig, setPipelineConfig] = useState<PipelineConfig>(initialPipelineConfig);

  const [promptTemplate, setPromptTemplate] = useState<string>(DEFAULT_PROMPT);
  const [additionalDictionary, setAdditionalDictionary] = useState<string>('');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [autoSaveInterval, setAutoSaveInterval] = useState<number>(2);
  const [enabledModels, setEnabledModels] = useState<string[]>(MODEL_CONFIGS.map(m => m.id));
  const [modelConfigs, setModelConfigs] = useState<ModelQuota[]>(MODEL_CONFIGS);

  const [openRouterKey, setOpenRouterKey] = useState<string>(() => {
    try { return localStorage.getItem('app_openrouter_key') || ''; } catch { return ''; }
  });
  const [openRouterModel, setOpenRouterModel] = useState<string>(() => {
    try { return localStorage.getItem('app_openrouter_model') || 'google/gemma-4-26b-a4b-it:free'; } catch { return 'google/gemma-4-26b-a4b-it:free'; }
  });
  const [deepseekKey, setDeepseekKey] = useState<string>(() => {
    try { return localStorage.getItem('app_deepseek_key') || ''; } catch { return ''; }
  });
  const [deepseekModel, setDeepseekModel] = useState<string>(() => {
    try { return localStorage.getItem('app_deepseek_model') || 'deepseek-v4-flash'; } catch { return 'deepseek-v4-flash'; }
  });
  
  // Real-time Usage Stats
  const [modelUsages, setModelUsages] = useState(quotaManager.getUsageSnapshot());

  const [batchLimits, setBatchLimits] = useState<BatchLimits>({
    latin: { v36: 6, v35: 6, v3: 6, v31: 12, v25: 6, maxTotalChars: 90000 },
    complex: { v36: 6, v35: 6, v3: 6, v31: 12, v25: 6, maxTotalChars: 45000 }
  });
  
  const [ratioLimits, setRatioLimits] = useState<RatioLimits>({
    vn: { ...DEFAULT_RATIO_LIMITS.vn },
    en: { ...DEFAULT_RATIO_LIMITS.en },
    krjp: { ...DEFAULT_RATIO_LIMITS.krjp },
    cn: { ...DEFAULT_RATIO_LIMITS.cn },
  });

  const [concurrency, setConcurrency] = useState<number | 'auto'>('auto');
  const [isResetting, setIsResetting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const lastSavedRef = useRef<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const isResettingRef = useRef(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const isLoadedRef = useRef(false);
  const isStateSyncedRef = useRef(false);
  const isSyncFailedRef = useRef(false);
  const hasUnsavedChangesRef = useRef(false);
  
  // Subscribe to QuotaManager updates
  useEffect(() => {
    const unsubscribe = quotaManager.subscribe(() => {
      setModelUsages(quotaManager.getUsageSnapshot());
    });
    return unsubscribe;
  }, []);

  const stateRef = useRef({ 
    files, promptTemplate, storyInfo, bookStyle, pronounProfile, characterAddressing, fewShotPool, pipelineConfig,
    additionalDictionary, autoSaveInterval, enabledModels, modelConfigs, batchLimits, ratioLimits, coverImage, concurrency, 
    openRouterKey, openRouterModel, deepseekKey, deepseekModel 
  });

  /* eslint-disable react-hooks/refs, react-hooks/use-memo, react-hooks/exhaustive-deps */
  const setFilesSafe = useCallback(createSafeSetter<FileItem[]>('files', setFiles, stateRef), []);
  const setStoryInfoSafe = useCallback(createSafeSetter<StoryInfo>('storyInfo', setStoryInfo, stateRef), []);
  const setBookStyleSafe = useCallback(createSafeSetter<BookStyleProfile>('bookStyle', setBookStyle, stateRef), []);
  const setPronounProfileSafe = useCallback(createSafeSetter<PronounProfile>('pronounProfile', setPronounProfile, stateRef), []);
  const setCharacterAddressingSafe = useCallback(createSafeSetter<CharacterAddressingContext>('characterAddressing', setCharacterAddressing, stateRef), []);
  const setFewShotPoolSafe = useCallback(createSafeSetter<FewShotExample[]>('fewShotPool', setFewShotPool, stateRef), []);
  const setPipelineConfigSafe = useCallback(createSafeSetter<PipelineConfig>('pipelineConfig', setPipelineConfig, stateRef), []);

  const setPromptTemplateSafe = useCallback(createSafeSetter<string>('promptTemplate', setPromptTemplate, stateRef), []);
  const setAdditionalDictionarySafe = useCallback(createSafeSetter<string>('additionalDictionary', setAdditionalDictionary, stateRef), []);
  const setCoverImageSafe = useCallback(createSafeSetter<File | null>('coverImage', setCoverImage, stateRef), []);
  const setEnabledModelsSafe = useCallback(createSafeSetter<string[]>('enabledModels', setEnabledModels, stateRef), []);
  const setBatchLimitsSafe = useCallback(createSafeSetter<BatchLimits>('batchLimits', setBatchLimits, stateRef), []);
  const setRatioLimitsSafe = useCallback(createSafeSetter<RatioLimits>('ratioLimits', setRatioLimits, stateRef), []);
  const setConcurrencySafe = useCallback(createSafeSetter<number | 'auto'>('concurrency', setConcurrency, stateRef), []);
  const setAutoSaveIntervalSafe = useCallback(createSafeSetter<number>('autoSaveInterval', setAutoSaveInterval, stateRef), []);
  const setModelConfigsSafe = useCallback(createSafeSetter<ModelQuota[]>('modelConfigs', setModelConfigs, stateRef), []);

  const setOpenRouterKeySafe = useCallback(createSafeSetter<string>('openRouterKey', setOpenRouterKey, stateRef, (next) => {
    try { localStorage.setItem('app_openrouter_key', next); } catch {}
  }), []);

  const setOpenRouterModelSafe = useCallback(createSafeSetter<string>('openRouterModel', setOpenRouterModel, stateRef, (next) => {
    try { localStorage.setItem('app_openrouter_model', next); } catch {}
  }), []);

  const setDeepseekKeySafe = useCallback(createSafeSetter<string>('deepseekKey', setDeepseekKey, stateRef, (next) => {
    try { localStorage.setItem('app_deepseek_key', next); } catch {}
  }), []);

  const setDeepseekModelSafe = useCallback(createSafeSetter<string>('deepseekModel', setDeepseekModel, stateRef, (next) => {
    try { localStorage.setItem('app_deepseek_model', next); } catch {}
  }), []);

  // Update stateRef whenever states change
  useEffect(() => {
    stateRef.current = { 
      files, promptTemplate, storyInfo, bookStyle, pronounProfile, characterAddressing, fewShotPool, pipelineConfig,
      additionalDictionary, autoSaveInterval, enabledModels, modelConfigs, batchLimits, ratioLimits, coverImage, concurrency, 
      openRouterKey, openRouterModel, deepseekKey, deepseekModel 
    };
  }, [
    files, promptTemplate, storyInfo, bookStyle, pronounProfile, characterAddressing, fewShotPool, pipelineConfig,
    additionalDictionary, autoSaveInterval, enabledModels, modelConfigs, batchLimits, ratioLimits, coverImage, concurrency, 
    openRouterKey, openRouterModel, deepseekKey, deepseekModel
  ]);

  const loadData = useCallback(async () => {
    try {
      const data = await loadFromStorage(STORAGE_KEY);
      if (data) {
        if (data.files && Array.isArray(data.files)) setFilesSafe(data.files);
        if (data.storyInfo) setStoryInfoSafe({ ...initialStoryInfo, ...data.storyInfo });
        if (data.bookStyle) setBookStyleSafe({ ...DEFAULT_BOOK_STYLE, ...data.bookStyle });
        if (data.pronounProfile) setPronounProfileSafe({ ...DEFAULT_PRONOUN_PROFILE, ...data.pronounProfile });
        if (data.characterAddressing) setCharacterAddressingSafe({ ...INITIAL_CHARACTER_CONTEXT, ...data.characterAddressing });
        if (data.fewShotPool && Array.isArray(data.fewShotPool)) setFewShotPoolSafe(data.fewShotPool);
        if (data.pipelineConfig) setPipelineConfigSafe({ ...initialPipelineConfig, ...data.pipelineConfig });

        if (data.promptTemplate) setPromptTemplateSafe(data.promptTemplate);
        if (data.additionalDictionary !== undefined) setAdditionalDictionarySafe(data.additionalDictionary);
        if (data.autoSaveInterval) setAutoSaveIntervalSafe(data.autoSaveInterval);
        if (data.enabledModels) setEnabledModelsSafe(data.enabledModels);
        if (data.modelConfigs) setModelConfigsSafe(data.modelConfigs);
        if (data.batchLimits) setBatchLimitsSafe(data.batchLimits);
        if (data.ratioLimits) setRatioLimitsSafe(data.ratioLimits);
        if (data.concurrency) setConcurrencySafe(data.concurrency);
        if (data.openRouterKey) setOpenRouterKeySafe(data.openRouterKey);
        if (data.openRouterModel) setOpenRouterModelSafe(data.openRouterModel);
        if (data.deepseekKey) setDeepseekKeySafe(data.deepseekKey);
        if (data.deepseekModel) setDeepseekModelSafe(data.deepseekModel);

        if (data.coverImageBase64) {
          try {
            const file = base64ToFile(data.coverImageBase64, 'cover.jpg');
            setCoverImageSafe(file);
          } catch (e) {
            console.error('Failed to restore cover image', e);
          }
        }

        if (data.lastSaved) {
          const date = new Date(data.lastSaved);
          setLastSaved(date);
          lastSavedRef.current = date;
        }

        quotaManager.updateConfigs(MODEL_CONFIGS);
        setModelUsages(quotaManager.getUsageSnapshot());
      } else {
        try { localStorage.removeItem('app_global_last_saved'); } catch {}
      }
      isStateSyncedRef.current = true;
      isLoadedRef.current = true;
      setIsLoaded(true);
    } catch (err) { 
      console.error('Restore failed:', err); 
      setLoadError(true);
      setIsLoaded(true);
      addToast('Lỗi kết nối bộ nhớ! Dữ liệu cũ có thể bị tạm khóa.', 'error');
    }
  }, [addToast, setAdditionalDictionarySafe, setAutoSaveIntervalSafe, setBatchLimitsSafe, setCoverImageSafe, setEnabledModelsSafe, setFilesSafe, setPromptTemplateSafe, setRatioLimitsSafe, setStoryInfoSafe, setBookStyleSafe, setPronounProfileSafe, setCharacterAddressingSafe, setFewShotPoolSafe, setPipelineConfigSafe, setConcurrencySafe, setOpenRouterKeySafe, setOpenRouterModelSafe, setDeepseekKeySafe, setDeepseekModelSafe]);

  useEffect(() => {
    if (navigator.storage && navigator.storage.persist) { 
      navigator.storage.persist().catch(() => {}); 
    }
    loadData();
  }, [loadData]);

  // Sync enabled models to QuotaManager
  useEffect(() => { quotaManager.setEnabledModels(enabledModels); }, [enabledModels]);

  const isSavingRef = useRef(false);
  const pendingSaveRef = useRef(false);
  const pendingForceRef = useRef(false);

  const saveSession = useCallback(async (force: boolean = false, overrideStale: boolean = false): Promise<boolean> => {
    if (isResettingRef.current || !isLoadedRef.current || loadError || !isStateSyncedRef.current) {
      return false;
    }
    
    if (isSavingRef.current) {
      pendingSaveRef.current = true;
      if (force) pendingForceRef.current = true;
      return true;
    }
    
    isSavingRef.current = true;
    hasUnsavedChangesRef.current = false;
    const isForced = force || pendingForceRef.current;
    pendingForceRef.current = false;
    
    try {
      setIsAutoSaving(true);
      const newLastSaved = new Date();
      const dataToSave: any = { ...stateRef.current, lastSaved: newLastSaved.toISOString() };
      
      if (dataToSave.coverImage instanceof File) {
        try {
          dataToSave.coverImageBase64 = await fileToBase64(dataToSave.coverImage);
          delete dataToSave.coverImage;
        } catch (e) {
          console.error('Failed to convert coverImage to base64', e);
        }
      }
      
      await saveToStorage(STORAGE_KEY, dataToSave);
      
      isSyncFailedRef.current = false;
      setLastSaved(newLastSaved);
      lastSavedRef.current = newLastSaved;
      
      try {
        localStorage.setItem('app_global_last_saved', newLastSaved.getTime().toString());
      } catch {}
      
      return true;
    } catch (e: any) { 
      console.error('Auto-save failed:', e); 
      isSyncFailedRef.current = true;
      hasUnsavedChangesRef.current = true;
      if (e.name === 'QuotaExceededError') {
        addToast('Bộ nhớ trình duyệt đã đầy! Hãy xóa bớt file hoặc backup.', 'error');
      }
      return false;
    } finally { 
      setIsAutoSaving(false); 
      isSavingRef.current = false;
      if (pendingSaveRef.current) {
        pendingSaveRef.current = false;
        setTimeout(() => saveSession(pendingForceRef.current), 0);
      }
    }
  }, [addToast, loadError]);

  // Track changes
  useEffect(() => {
    if (isLoadedRef.current) {
      hasUnsavedChangesRef.current = true;
    }
  }, [
    files, storyInfo, bookStyle, pronounProfile, characterAddressing, fewShotPool, pipelineConfig,
    promptTemplate, additionalDictionary, enabledModels, batchLimits, ratioLimits, concurrency, 
    autoSaveInterval, modelConfigs, coverImage, openRouterKey, openRouterModel, deepseekKey, deepseekModel
  ]);

  // Periodic Auto Save
  useEffect(() => {
    const intervalMs = (autoSaveInterval || 2) * 60 * 1000;
    const handler = setInterval(() => {
      if (hasUnsavedChangesRef.current) {
        saveSession();
      }
    }, Math.max(10000, intervalMs));
    return () => clearInterval(handler);
  }, [autoSaveInterval, saveSession]);

  const performSoftReset = async () => {
    setIsResetting(true);
    isResettingRef.current = true;
    await new Promise(r => setTimeout(r, 50));
    try {
      await clearDatabase();
      try { localStorage.clear(); } catch {}
      quotaManager.clearUsage();
      setFilesSafe([]);
      setStoryInfoSafe(initialStoryInfo);
      setBookStyleSafe(DEFAULT_BOOK_STYLE);
      setPronounProfileSafe(DEFAULT_PRONOUN_PROFILE);
      setCharacterAddressingSafe(INITIAL_CHARACTER_CONTEXT);
      setFewShotPoolSafe(INITIAL_FEW_SHOT_POOL);
      setPipelineConfigSafe(initialPipelineConfig);

      setPromptTemplateSafe(DEFAULT_PROMPT);
      setAdditionalDictionarySafe('');
      setCoverImageSafe(null);
      setEnabledModelsSafe(MODEL_CONFIGS.map(m => m.id));
      setModelUsages(quotaManager.getUsageSnapshot());
      setBatchLimitsSafe({
        latin: { v36: 6, v35: 6, v3: 6, v31: 12, v25: 6, maxTotalChars: 90000 },
        complex: { v36: 6, v35: 6, v3: 6, v31: 12, v25: 6, maxTotalChars: 45000 }
      });
      setRatioLimitsSafe({
        vn: { ...DEFAULT_RATIO_LIMITS.vn },
        en: { ...DEFAULT_RATIO_LIMITS.en },
        krjp: { ...DEFAULT_RATIO_LIMITS.krjp },
        cn: { ...DEFAULT_RATIO_LIMITS.cn },
      });
      setConcurrencySafe('auto');
      setOpenRouterKeySafe('');
      setOpenRouterModelSafe('google/gemma-4-26b-a4b-it:free');
      setDeepseekKeySafe('');
      setDeepseekModelSafe('deepseek-v4-flash');
      addToast('Đã Reset toàn bộ dữ liệu!', 'success');
    } catch {
      addToast('Lỗi khi reset, vui lòng tải lại trang.', 'error');
    } finally {
      isResettingRef.current = false;
      setIsResetting(false);
    }
  };

  return {
    files, setFiles: setFilesSafe,
    storyInfo, setStoryInfo: setStoryInfoSafe,
    bookStyle, setBookStyle: setBookStyleSafe,
    pronounProfile, setPronounProfile: setPronounProfileSafe,
    characterAddressing, setCharacterAddressing: setCharacterAddressingSafe,
    fewShotPool, setFewShotPool: setFewShotPoolSafe,
    pipelineConfig, setPipelineConfig: setPipelineConfigSafe,

    promptTemplate, setPromptTemplate: setPromptTemplateSafe,
    additionalDictionary, setAdditionalDictionary: setAdditionalDictionarySafe,
    coverImage, setCoverImage: setCoverImageSafe,
    autoSaveInterval, setAutoSaveInterval: setAutoSaveIntervalSafe,
    enabledModels, setEnabledModels: setEnabledModelsSafe,
    modelConfigs, setModelConfigs: setModelConfigsSafe,
    openRouterKey, setOpenRouterKey: setOpenRouterKeySafe,
    openRouterModel, setOpenRouterModel: setOpenRouterModelSafe,
    deepseekKey, setDeepseekKey: setDeepseekKeySafe,
    deepseekModel, setDeepseekModel: setDeepseekModelSafe,
    batchLimits, setBatchLimits: setBatchLimitsSafe,
    ratioLimits, setRatioLimits: setRatioLimitsSafe,
    concurrency, setConcurrency: setConcurrencySafe,
    isResetting, performSoftReset,
    isAutoSaving, lastSaved, saveSession,
    isLoaded,
    loadError,
    modelUsages,
    setModelUsages,
    stateRef
  };
};

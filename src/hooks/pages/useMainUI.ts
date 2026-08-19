import React, { useState, useMemo } from 'react';
import { validateTranslationIntegrity } from '../../utils/text';
import { FileItem, StoryInfo, ModelQuota, BatchLimits, TranslationTier, RatioLimits, FileStatus } from '../../types';

export interface MainUIProps {
  files: FileItem[];
  stats: any;
  progressPercentage: number;
  storyInfo: StoryInfo;
  setStoryInfo: React.Dispatch<React.SetStateAction<StoryInfo>>;
  
  // UI State Props
  showSettings: boolean;
  setShowSettings: (v: boolean) => void;
  showLogs: boolean;
  setShowLogs: (v: boolean) => void;
  systemLogs: any[];
  hasLogErrors: boolean;
  isDragging: boolean;
  
  // Header & Sidebar Logic
  onShowChangelog: () => void;
  onShowIntro: () => void;
  isAutoSaving: boolean;
  lastSaved: Date | null;
  enabledModels: string[];
  modelConfigs: ModelQuota[];
  modelUsages: any;
  toggleModel: (id: string) => void;
  handleManualResetQuota: () => void;
  handleTestModel: (id: string) => void;
  testingModelId: string | null;
  startTime: number | null;
  endTime: number | null;
  setStartTime?: (v: number | null) => void;
  setEndTime?: (v: number | null) => void;
  addLog?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  
  // Story Info
  setStoryInfoSafe: (info: StoryInfo) => void;
  
  // File Logic
  setFilesSafe: (files: FileItem[]) => void;
  
  // Batch Config Logic
  batchLimits: BatchLimits;
  setBatchLimits: React.Dispatch<React.SetStateAction<BatchLimits>>;
  
  // Concurrency Logic
  concurrency: number | 'auto';
  setConcurrency: React.Dispatch<React.SetStateAction<number | 'auto'>>;

  // Ratio Config Logic
  ratioLimits: RatioLimits;
  setRatioLimits: React.Dispatch<React.SetStateAction<RatioLimits>>;

  // Dark Mode Props
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Dashboard Logic
  coverPreviewUrl: string | null;
  handleCoverUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAutoAnalyze: () => void;
  isAutoAnalyzing: boolean;
  autoAnalyzeStatus: string;
  quickInput: string;
  setQuickInput: (v: string) => void;
  handleQuickParse: () => void;
  handleRegenerateCover: () => void;
  isGeneratingCover: boolean;
  handleBackup: () => void;
  handleRestore: (e: React.ChangeEvent<HTMLInputElement>) => Promise<boolean> | void;
  requestResetApp: () => void;
  handleRefineSummary: () => void;

  // Knowledge Logic
  handleContextDownload: () => void;
  handleContextFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setShowContextBuilder: (v: boolean) => void;
  viewOriginalPrompt: boolean;
  setViewOriginalPrompt: (v: boolean) => void;
  handlePromptUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  resetPrompt: () => void;
  promptTemplate: string;
  setPromptTemplate: (v: string) => void;
  handleOptimizePrompt: () => void;
  isOptimizingPrompt: boolean;
  selectedTemplateKey: string;
  setSelectedTemplateKey: (v: string) => void;
  handleDictionaryDownload: () => void;
  handleDictionaryUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  dictTab: 'custom' | 'default';
  setDictTab: (v: 'custom' | 'default') => void;
  additionalDictionary: string;
  setAdditionalDictionary: (v: string) => void;

  // Workspace Logic
  currentPage: number;
  setCurrentPage: (v: number) => void;
  totalPages: number;
  visibleFiles: FileItem[];
  selectedFiles: Set<string>;
  setSelectedFiles: (ids: Set<string>) => void;
  handleSelectFile: (id: string, shiftKey: boolean) => void;
  handleManualFixSingle: (e: React.MouseEvent, id: string) => void;
  handleRescueCopy: (e: React.MouseEvent, file: FileItem) => void;
  requestRetranslateSingle: (e: React.MouseEvent, id: string) => void;
  openEditor: (file: FileItem) => void;
  handleRemoveFile: (id: string) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setShowPasteModal: (v: boolean) => void;
  selectAll: () => void;
  rangeStart: string;
  setRangeStart: (v: string) => void;
  rangeEnd: string;
  setRangeEnd: (v: string) => void;
  handleRangeSelect: () => void;
  setShowFindReplace: (v: boolean) => void;
  isProcessing: boolean;
  isCustomFixing?: boolean;
  showFilterPanel: boolean;
  setShowFilterPanel: (v: boolean) => void;
  filterModels: Set<string>;
  filterStatuses: Set<string>;
  toggleFilterModel: (key: string) => void;
  toggleFilterStatus: (key: string) => void;
  clearFilters: () => void;
  handleScanJunk: () => void;
  handleScanFuzzyDuplicates: () => void;
  handleRemoveDuplicates: (scope: 'all' | 'selected') => void;
  handleFilterMismatchedRatio: () => void;
  handleManualCleanup: (scope: 'all' | 'selected') => void;
  handleRemoveJunk: (scope: 'all' | 'selected') => void;
  handleTitleNormalization: (scope: 'all' | 'selected') => void;
  stopTitleNormalization: () => void;
  isNormalizingTitles: boolean;
  handleAutoSplitChapters: (scope: 'all' | 'selected' | 'single', id?: string, threshold?: number, numParts?: number) => void;
  setShowRetranslateModal: (v: boolean) => void;
  handleSmartDelete: () => void;
  requestDeleteAll: () => void;
  handleDownloadRaw: (parts?: number) => void;
  handleDownloadTranslatedZip: () => void;
  handleDownloadMerged: () => void;
  handleExportDocx: () => void;
  handleDownloadSelected: () => void;
  handleSaveSelected: () => void;
  handleDownloadEpub: () => void;
  stopProcessing: () => void;
  handleStartButton: () => void;
  
  // 4-Stage Specific Handlers
  handleTranslateOnly?: (scope: 'all' | 'selected') => void;
  handleReviewOnly?: (scope: 'all' | 'selected') => void;
  handleEditOnly?: (scope: 'all' | 'selected') => void;
  handleQAOnly?: (scope: 'all' | 'selected') => void;

  setShowRawDownloadModal: (v: boolean) => void;
  setShowGuide: (v: boolean) => void;
  handleTranslatedFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleMergeSelected: () => void;
  handleDictionaryEnforce?: () => void;
  activeTab: 'dashboard' | 'knowledge' | 'workspace';
  setActiveTab: (v: 'dashboard' | 'knowledge' | 'workspace') => void;
  addToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  setConfirmModal: (modal: { isOpen: boolean; title: string; message: string; onConfirm: () => void; isDanger: boolean; confirmText?: string }) => void;
  
  openRouterKey?: string;
  setOpenRouterKey?: (key: string) => void;
  deepseekKey?: string;
  setDeepseekKey?: (key: string) => void;
}

export const useMainUI = (props: MainUIProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isBottomBarOpen, setIsBottomBarOpen] = useState(true);
  const [showOpenRouterPrompt, setShowOpenRouterPrompt] = useState(false);
  const [tempOpenRouterKey, setTempOpenRouterKey] = useState("");
  const [tempDeepseekKey, setTempDeepseekKey] = useState("");
  const [showSplitConfig, setShowSplitConfig] = useState(false);
  const [splitThreshold, setSplitThreshold] = useState("8000");
  const [splitParts, setSplitParts] = useState("");

  const { files, setCurrentPage, setActiveTab } = props;
  const prevFilesLength = React.useRef(files.length);
  React.useEffect(() => {
    if (files.length > prevFilesLength.current) {
      setActiveTab('workspace');
      setCurrentPage(1);
    }
    prevFilesLength.current = files.length;
  }, [files.length, setCurrentPage, setActiveTab]);

  return {
    isSidebarOpen, setIsSidebarOpen,
    isBottomBarOpen, setIsBottomBarOpen,
    showOpenRouterPrompt, setShowOpenRouterPrompt,
    tempOpenRouterKey, setTempOpenRouterKey,
    tempDeepseekKey, setTempDeepseekKey,
    showSplitConfig, setShowSplitConfig,
    splitThreshold, setSplitThreshold,
    splitParts, setSplitParts,
  };
};

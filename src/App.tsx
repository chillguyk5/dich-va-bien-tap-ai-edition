import React, { useEffect, useState, useRef } from 'react';
import { openRouterKeyManager } from './services/api/openrouter';
import { deepSeekKeyManager } from './services/api/deepseek';
import { MainUI } from './components/MainUI';
import { ModalManager } from './components/ModalManager';
import { ToastContainer, LoadingModal, RawDownloadModal, ApiSettingsModal } from './components/modals';
import { Loader2, AlertTriangle } from 'lucide-react';
import { IntroPage } from './components/IntroPage';

import { useCoreState } from './hooks/useCoreState';
import { useUIState } from './hooks/useUIState';
import { useFileHandler } from './hooks/useFileHandler';
import { useTranslationEngine } from './hooks/useTranslationEngine';
import { useAppHandlers } from './hooks/useAppHandlers';

import { FileStatus, RatioLimits, FileItem } from './types';
import { generateBasePrompt, ACCESS_CONFIG } from './constants';
import { DEFAULT_RATIO_LIMITS } from './constants/ratioLimits';
import { downloadTextFile } from './utils/fileHelpers';
import { quotaManager } from './utils/quotaManager';
import { countForeignChars, validateTranslationIntegrity } from './utils/text';

const App: React.FC = () => {
  const [hasSeenIntro, setHasSeenIntro] = useState<boolean>(false);
  const [forceShowIntro, setForceShowIntro] = useState<boolean>(false);

  // 1. Initialize State Hooks
  const ui = useUIState();
  const core = useCoreState(ui.addToast);
  
  // 2. Initialize Logic Hooks
  const engine = useTranslationEngine(core, ui);
  const fileHandler = useFileHandler(core, ui, () => {
    ui.setActiveTab('workspace');
    ui.setCurrentPage(1);
  });
  const appHandlers = useAppHandlers(core, ui, fileHandler, engine);

  // Auto-sync Cover Image Preview
  const { setCoverPreviewUrl } = ui;
  useEffect(() => {
    if (core.coverImage) {
      const url = URL.createObjectURL(core.coverImage);
      setCoverPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setCoverPreviewUrl(null);
    }
  }, [core.coverImage, setCoverPreviewUrl]);

  const { setRatioLimits } = core;
  useEffect(() => {
    setRatioLimits((prev: RatioLimits) => {
      let updated = false;
      const newLimits = { ...prev };
      if (!newLimits.vn) { newLimits.vn = { ...DEFAULT_RATIO_LIMITS.vn }; updated = true; }
      if (!newLimits.en) { newLimits.en = { ...DEFAULT_RATIO_LIMITS.en }; updated = true; }
      if (!newLimits.krjp) { newLimits.krjp = { ...DEFAULT_RATIO_LIMITS.krjp }; updated = true; }
      if (!newLimits.cn) { newLimits.cn = { ...DEFAULT_RATIO_LIMITS.cn }; updated = true; }

      if (!newLimits.vn.min) { newLimits.vn.min = DEFAULT_RATIO_LIMITS.vn.min; updated = true; }
      if (!newLimits.krjp.max) { newLimits.krjp.max = DEFAULT_RATIO_LIMITS.krjp.max; updated = true; }
      if (!newLimits.krjp.min) { newLimits.krjp.min = DEFAULT_RATIO_LIMITS.krjp.min; updated = true; }
      if (!newLimits.cn.min) { newLimits.cn.min = DEFAULT_RATIO_LIMITS.cn.min; updated = true; }
      if (!newLimits.cn.max) { newLimits.cn.max = DEFAULT_RATIO_LIMITS.cn.max; updated = true; }
      
      return updated ? newLimits : prev;
    });
  }, [setRatioLimits]);

  const prevRatioLimitsRef = useRef<string>(JSON.stringify(core.ratioLimits));
  useEffect(() => {
    const currentStringified = JSON.stringify(core.ratioLimits);
    if (prevRatioLimitsRef.current !== currentStringified) {
      prevRatioLimitsRef.current = currentStringified;
      core.setFiles((prevFiles: FileItem[]) => {
        let hasChanges = false;
        const newFiles = prevFiles.map((f: FileItem) => {
          if (f.status === FileStatus.COMPLETED && f.translatedContent) {
            const integrity = validateTranslationIntegrity(f.content, f.translatedContent, core.ratioLimits, core.storyInfo.languages, f.usedModel);
            if (!integrity.isValid) {
              hasChanges = true;
              return { ...f, status: FileStatus.ERROR, errorMessage: integrity.reason || 'Lỗi Ratio' };
            }
          }
          return f;
        });
        return hasChanges ? newFiles : prevFiles;
      });
    }
  }, [core.ratioLimits, core.setFiles, core.storyInfo.languages]);

  const visibleFiles = React.useMemo(() => {
    const filtered = core.files;
    if (ui.currentPage === 0) return filtered;
    const startIndex = (ui.currentPage - 1) * 100;
    return filtered.slice(startIndex, startIndex + 100);
  }, [core.files, ui.currentPage]);

  const totalPages = Math.ceil(core.files.length / 100);

  // Stats calculation
  const stats = React.useMemo(() => {
    const completed = core.files.filter((f: FileItem) => f.status === FileStatus.COMPLETED).length;
    const failed = core.files.filter((f: FileItem) => f.status === FileStatus.ERROR).length;
    const processing = core.files.filter((f: FileItem) => 
      f.status === FileStatus.TRANSLATING || f.status === FileStatus.REVIEWING || 
      f.status === FileStatus.EDITING || f.status === FileStatus.QA_CHECKING || f.status === FileStatus.QA_REPAIRING
    ).length;
    const pending = core.files.filter((f: FileItem) => f.status === FileStatus.IDLE).length;
    return {
      total: core.files.length,
      completed, failed, processing, pending
    };
  }, [core.files]);

  const progressPercentage = React.useMemo(() => {
    return core.files.length > 0 ? Math.round(((stats.completed + stats.failed) / core.files.length) * 100) : 0;
  }, [stats.completed, stats.failed, core.files.length]);

  const openEditor = React.useCallback((f: any) => ui.setEditingFileId(f.id), [ui.setEditingFileId]);
  const requestRetranslateSingle = React.useCallback((e: any, id: string) => { 
    e.stopPropagation(); 
    ui.setSelectedFiles(new Set([id])); 
    ui.setShowRetranslateModal(true); 
  }, [ui.setSelectedFiles, ui.setShowRetranslateModal]);

  const handleToggleModel = React.useCallback((id: string) => 
    core.setEnabledModels((prev: string[]) => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]), 
    [core.setEnabledModels]
  );
  
  const clearFilters = React.useCallback(() => { 
    ui.setFilterModels(new Set()); 
    ui.setFilterStatuses(new Set()); 
  }, [ui.setFilterModels, ui.setFilterStatuses]);

  const autoSaveEditor = React.useCallback((id: string, content: string) => {
    core.setFiles((prev: any[]) => prev.map((f: any) => f.id === id ? {
      ...f,
      translatedContent: content,
      finalTranslation: content,
      remainingRawCharCount: countForeignChars(content),
      status: FileStatus.COMPLETED,
      usedModel: 'Thủ công',
      errorMessage: undefined,
      ratioWarning: undefined,
      integrityOverrideAccepted: true,
    } : f));
  }, [core.setFiles]);

  const toggleFilterModel = React.useCallback((k: string) => ui.setFilterModels((p: Set<string>) => { const n = new Set(p); if(n.has(k)) n.delete(k); else n.add(k); return n; }), [ui.setFilterModels]);
  const toggleFilterStatus = React.useCallback((k: string) => ui.setFilterStatuses((p: Set<string>) => { const n = new Set(p); if(n.has(k)) n.delete(k); else n.add(k); return n; }), [ui.setFilterStatuses]);

  const handleCoverUpload = React.useCallback((e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      core.setCoverImage(file);
      ui.addToast("Đã tải lên ảnh bìa", "success");
    }
    e.target.value = '';
  }, [core.setCoverImage, ui.addToast]);

  useEffect(() => {
    openRouterKeyManager.syncKeys(core.openRouterKey);
  }, [core.openRouterKey]);

  useEffect(() => {
    deepSeekKeyManager.syncKeys(core.deepseekKey);
  }, [core.deepseekKey]);

  useEffect(() => {
    if (!ACCESS_CONFIG.EXPIRY_TS) return;
    const checkExpiry = () => {
      if (Date.now() > ACCESS_CONFIG.EXPIRY_TS) {
        setForceShowIntro(true);
      }
    };
    checkExpiry();
    const intervalId = setInterval(checkExpiry, 30000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkExpiry();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  if (!hasSeenIntro || forceShowIntro) {
    return <IntroPage onEnter={() => {
      setHasSeenIntro(true);
      setForceShowIntro(false);
    }} />;
  }

  if (!core.isLoaded) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-600 animate-in fade-in">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <h2 className="text-xl font-bold">Đang tải dữ liệu...</h2>
      </div>
    );
  }

  if (core.isResetting) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-600 animate-in fade-in">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <h2 className="text-xl font-bold">Resetting System...</h2>
      </div>
    );
  }

  return (
    <div className={`h-[100dvh] w-screen flex flex-col font-sans transition-colors duration-300 overflow-hidden ${ui.isDarkMode ? 'dark bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`} onDragOver={e => {e.preventDefault(); ui.setIsDragging(true)}} onDragLeave={e => {e.preventDefault(); ui.setIsDragging(false)}} onDrop={e => {e.preventDefault(); ui.setIsDragging(false); if(e.dataTransfer.files) fileHandler.processFiles(Array.from(e.dataTransfer.files));}}>
      <ToastContainer toasts={ui.toasts} removeToast={ui.removeToast} />
      {ui.importProgress && <LoadingModal isOpen={!!ui.importProgress} progress={ui.importProgress} />}
      
      <RawDownloadModal isOpen={ui.showRawDownloadModal} onClose={() => ui.setShowRawDownloadModal(false)} onConfirm={(parts) => fileHandler.handleDownloadRaw(parts)} />
      
      <ApiSettingsModal isOpen={ui.showSettings} onClose={() => ui.setShowSettings(false)} openRouterKey={core.openRouterKey} setOpenRouterKey={core.setOpenRouterKey} openRouterModel={core.openRouterModel} setOpenRouterModel={core.setOpenRouterModel} deepseekKey={core.deepseekKey} setDeepseekKey={core.setDeepseekKey} deepseekModel={core.deepseekModel} setDeepseekModel={core.setDeepseekModel} />

      <ModalManager 
        showPasteModal={ui.showPasteModal} setShowPasteModal={ui.setShowPasteModal}
        showFindReplace={ui.showFindReplace} setShowFindReplace={ui.setShowFindReplace}
        confirmModal={ui.confirmModal} setConfirmModal={ui.setConfirmModal}
        importModal={ui.importModal} setImportModal={ui.setImportModal}
        splitterModal={ui.splitterModal} setSplitterModal={ui.setSplitterModal}
        zipActionModal={ui.zipActionModal} setZipActionModal={ui.setZipActionModal} zipActionModalSourceType={ui.zipActionModalSourceType}
        handleZipKeepSeparate={fileHandler.handleZipKeepSeparate}
        handleZipMergeAndSplit={fileHandler.handleZipMergeAndSplit}
        showGuide={ui.showGuide} setShowGuide={ui.setShowGuide}
        showStartOptions={ui.showStartOptions} setShowStartOptions={ui.setShowStartOptions}
        showChangelog={ui.showChangelog} setShowChangelog={ui.setShowChangelog}
        editingFileId={ui.editingFileId} setEditingFileId={ui.setEditingFileId}
        showEpubModal={ui.showEpubModal} setShowEpubModal={ui.setShowEpubModal}
        showLogs={ui.showLogs} setShowLogs={ui.setShowLogs}
        systemLogs={ui.systemLogs} clearLogs={ui.clearLogs}
        
        handlePasteConfirm={fileHandler.handlePasteConfirm}
        handleFindReplace={appHandlers.handleFindReplace}
        selectedCount={ui.selectedFiles.size}
        handleImportAppend={fileHandler.handleImportAppend}
        handleImportOverwrite={fileHandler.handleImportOverwrite}
        handleSplitConfirm={fileHandler.handleSplitConfirm}
        handleConfirmStart={(tier) => { ui.setShowStartOptions(false); engine.setTranslationTier(tier); engine.executeProcessing(); }}
        storyInfo={core.storyInfo}
        files={core.files}
        handleSaveFileContent={(id, content) => {
          core.setFiles((prev: any) => prev.map((f: any) => f.id === id ? { ...f, translatedContent: content, finalTranslation: content } : f));
          ui.setEditingFileId(null);
        }}
        handleAutoSaveFileContent={autoSaveEditor}
        additionalDictionary={core.additionalDictionary}
        promptTemplate={core.promptTemplate}
        handleAddToGlossary={(raw, edit) => {
          core.setAdditionalDictionary((prev: string) => `${prev}\n${raw} = ${edit}`);
          ui.addToast(`Đã thêm vào Từ Điển: ${raw} = ${edit}`, 'success');
        }}
        handleReplaceAllInFiles={(find, replace) => appHandlers.handleFindReplace([{ find, replace }], 'all')}
        addToast={ui.addToast}
      />

      {core.loadError && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center border border-rose-200 dark:border-rose-900/50">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Lỗi Kết Nối Bộ Nhớ</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              Ứng dụng không thể kết nối với cơ sở dữ liệu trình duyệt (IndexedDB).
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg"
            >
              Tải Lại Trang Ngay
            </button>
          </div>
        </div>
      )}

      <MainUI 
        activeTab={ui.activeTab}
        setActiveTab={ui.setActiveTab}
        files={core.files}
        stats={stats}
        progressPercentage={progressPercentage}
        storyInfo={core.storyInfo}
        setStoryInfo={core.setStoryInfo}
        setStoryInfoSafe={core.setStoryInfo}
        setFilesSafe={core.setFiles}
        
        showSettings={ui.showSettings}
        setShowSettings={ui.setShowSettings}
        showLogs={ui.showLogs}
        setShowLogs={ui.setShowLogs}
        systemLogs={ui.systemLogs}
        hasLogErrors={ui.hasLogErrors}
        isDragging={ui.isDragging}
        
        isAutoSaving={core.isAutoSaving}
        lastSaved={core.lastSaved}
        
        enabledModels={core.enabledModels}
        toggleModel={handleToggleModel}
        modelConfigs={core.modelConfigs}
        modelUsages={core.modelUsages} 
        
        handleManualResetQuota={() => {
          quotaManager.clearUsage();
          openRouterKeyManager.resetQuota();
          core.setModelUsages(quotaManager.getUsageSnapshot());
          ui.addToast("Đã reset sử dụng API Quota và OpenRouter.", "success");
        }}
        handleTestModel={appHandlers.handleTestModel}
        testingModelId={ui.testingModelId}
        
        batchLimits={core.batchLimits}
        setBatchLimits={core.setBatchLimits}
        ratioLimits={core.ratioLimits}
        setRatioLimits={core.setRatioLimits}
        
        isDarkMode={ui.isDarkMode}
        toggleDarkMode={ui.toggleDarkMode}
        concurrency={core.concurrency}
        setConcurrency={core.setConcurrency}
        
        // Dashboard
        coverPreviewUrl={ui.coverPreviewUrl}
        handleCoverUpload={handleCoverUpload}
        handleAutoAnalyze={() => {}}
        handleRefineSummary={appHandlers.handleRefineSummary}
        isAutoAnalyzing={false}
        autoAnalyzeStatus=""
        quickInput={ui.quickInput}
        setQuickInput={ui.setQuickInput}
        handleQuickParse={appHandlers.handleQuickParse}
        handleRegenerateCover={async () => {}}
        isGeneratingCover={false}
        handleBackup={fileHandler.handleBackup}
        handleRestore={fileHandler.handleRestore}
        requestResetApp={appHandlers.requestResetApp}
        
        // Knowledge
        handleContextDownload={() => downloadTextFile("Context.txt", core.storyInfo.contextNotes || "")}
        handleContextFileUpload={appHandlers.handleContextFileUpload}
        setShowContextBuilder={ui.setShowContextBuilder}
        viewOriginalPrompt={ui.viewOriginalPrompt}
        setViewOriginalPrompt={ui.setViewOriginalPrompt}
        handlePromptUpload={appHandlers.handlePromptUpload}
        resetPrompt={() => core.setPromptTemplate(generateBasePrompt(core.storyInfo.genres, core.storyInfo.worldSetting || []))}
        promptTemplate={core.promptTemplate}
        setPromptTemplate={core.setPromptTemplate}
        handleOptimizePrompt={() => {}}
        isOptimizingPrompt={false}
        handleDictionaryDownload={() => downloadTextFile("Dictionary.txt", core.additionalDictionary)}
        handleDictionaryUpload={appHandlers.handleDictionaryUpload}
        dictTab={ui.dictTab}
        setDictTab={ui.setDictTab}
        additionalDictionary={core.additionalDictionary}
        setAdditionalDictionary={core.setAdditionalDictionary}
        
        // Workspace
        currentPage={ui.currentPage}
        setCurrentPage={ui.setCurrentPage}
        totalPages={totalPages}
        visibleFiles={visibleFiles}
        selectedFiles={ui.selectedFiles}
        setSelectedFiles={ui.setSelectedFiles}
        handleSelectFile={appHandlers.handleSelectFile}
        handleManualFixSingle={() => {}}
        handleRescueCopy={appHandlers.handleRescueCopy}
        requestRetranslateSingle={requestRetranslateSingle}
        openEditor={openEditor}
        handleRemoveFile={appHandlers.handleRemoveFile}
        handleFileUpload={appHandlers.handleFileUpload}
        handleTranslatedFileUpload={appHandlers.handleTranslatedFileUpload}
        setShowPasteModal={ui.setShowPasteModal}
        selectAll={appHandlers.selectAll}
        rangeStart={ui.rangeStart}
        setRangeStart={ui.setRangeStart}
        rangeEnd={ui.rangeEnd}
        setRangeEnd={ui.setRangeEnd}
        handleRangeSelect={appHandlers.handleRangeSelect}
        setShowFindReplace={ui.setShowFindReplace}
        isProcessing={engine.isProcessing}
        
        showFilterPanel={ui.showFilterPanel}
        setShowFilterPanel={ui.setShowFilterPanel}
        filterModels={ui.filterModels}
        filterStatuses={ui.filterStatuses}
        toggleFilterModel={toggleFilterModel}
        toggleFilterStatus={toggleFilterStatus}
        clearFilters={clearFilters}
        
        handleScanJunk={fileHandler.handleScanJunk}
        handleScanFuzzyDuplicates={fileHandler.handleScanFuzzyDuplicates}
        handleRemoveDuplicates={fileHandler.handleRemoveDuplicates}
        handleAutoSplitChapters={fileHandler.handleAutoSplitChapters}
        handleFilterMismatchedRatio={appHandlers.handleFilterMismatchedRatio}
        handleManualCleanup={appHandlers.handleManualCleanup}
        handleRemoveJunk={appHandlers.handleRemoveJunk}
        handleTitleNormalization={() => {}}
        stopTitleNormalization={() => {}}
        isNormalizingTitles={false}
        setShowRetranslateModal={ui.setShowRetranslateModal}
        handleSmartDelete={appHandlers.handleSmartDelete} 
        requestDeleteAll={appHandlers.requestDeleteAll}
        
        handleDownloadRaw={fileHandler.handleDownloadRaw}
        handleDownloadTranslatedZip={fileHandler.handleDownloadTranslatedZip}
        handleDownloadMerged={fileHandler.handleDownloadMerged}
        handleExportDocx={fileHandler.handleExportDocx}
        handleDownloadSelected={appHandlers.handleDownloadSelected}
        handleSaveSelected={appHandlers.handleSaveSelected}
        handleDownloadEpub={() => ui.setShowEpubModal(true)}
        
        stopProcessing={engine.stopProcessing}
        handleStartButton={() => engine.executeProcessing(ui.selectedFiles.size > 0 ? 'selected' : 'all')}
        
        // 4-Stage Specific Action Handlers
        handleTranslateOnly={engine.executeTranslateOnly}
        handleReviewOnly={engine.executeReviewOnly}
        handleEditOnly={engine.executeEditOnly}
        handleQAOnly={engine.executeQAOnly}

        setShowRawDownloadModal={ui.setShowRawDownloadModal}
        handleMergeSelected={appHandlers.handleMergeSelected}
        handleDictionaryEnforce={appHandlers.handleDictionaryEnforce}

        onShowChangelog={() => ui.setShowChangelog(true)}
        onShowIntro={() => setForceShowIntro(true)}
        startTime={engine.startTime}
        setStartTime={engine.setStartTime}
        endTime={engine.endTime}
        setEndTime={engine.setEndTime}
        addLog={ui.addLog}
        setShowGuide={ui.setShowGuide}
        selectedTemplateKey=""
        setSelectedTemplateKey={() => {}}
        addToast={ui.addToast}
        setConfirmModal={ui.setConfirmModal}
        openRouterKey={core.openRouterKey}
        setOpenRouterKey={core.setOpenRouterKey}
        deepseekKey={core.deepseekKey}
        setDeepseekKey={core.setDeepseekKey}
      />
    </div>
  );
};

export default App;

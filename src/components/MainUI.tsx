import React from 'react';
import { 
  LayoutDashboard, BookOpen, PenTool,
  Plus, Clipboard, CheckSquare, ArrowRight, Check, Search, Sparkles, Loader2, 
  ListFilter, Eraser, RefreshCw, Trash2, FileDown, FileArchive, 
  FileText, Play, Book, Zap, Wand2, Layers, Split,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Save, Upload, RotateCcw,
  ShieldCheck, ScanSearch
} from 'lucide-react';
import { Header } from './Header';
import { DashboardPage } from './DashboardPage';
import { KnowledgePage } from './KnowledgePage';
import { WorkspacePage } from './WorkspacePage';
import { useMainUI, MainUIProps } from '../hooks/pages/useMainUI';

export const MainUI: React.FC<MainUIProps> = (props) => {
  const { activeTab, setActiveTab } = props;
  const {
    isSidebarOpen, setIsSidebarOpen,
    isBottomBarOpen, setIsBottomBarOpen,
    showSplitConfig, setShowSplitConfig,
  } = useMainUI(props);

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200 transition-colors duration-300 overflow-hidden">
      {/* 1. Universal Header */}
      <div className="flex-none z-50">
        <Header 
          stats={props.stats}
          showLogs={props.showLogs}
          setShowLogs={props.setShowLogs}
          showSettings={props.showSettings}
          setShowSettings={props.setShowSettings}
          onShowChangelog={props.onShowChangelog}
          onShowIntro={props.onShowIntro}
          enabledModels={props.enabledModels}
          modelConfigs={props.modelConfigs}
          modelUsages={props.modelUsages}
          toggleModel={props.toggleModel}
          handleManualResetQuota={props.handleManualResetQuota}
          handleTestModel={props.handleTestModel}
          testingModelId={props.testingModelId}
          startTime={props.startTime}
          endTime={props.endTime}
          hasLogErrors={props.hasLogErrors}
          progressPercentage={props.progressPercentage}
          batchLimits={props.batchLimits}
          setBatchLimits={props.setBatchLimits}
          ratioLimits={props.ratioLimits}
          setRatioLimits={props.setRatioLimits}
          concurrency={props.concurrency}
          setConcurrency={props.setConcurrency}
          isDarkMode={props.isDarkMode}
          toggleDarkMode={props.toggleDarkMode}
        />
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* 2. DESKTOP SIDEBAR */}
        <aside className={`hidden lg:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-40 shrink-0 transition-all duration-300 relative ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute -right-3 top-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1 shadow-elevation-2 z-50 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 transition-transform duration-200 ease-smooth hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-1"
          >
            {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
            {isSidebarOpen && <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2 whitespace-nowrap">Navigation</h2>}
            <div className="space-y-2">
              <button 
                onClick={() => { setActiveTab('workspace'); props.setCurrentPage(1); }} 
                className={`w-full flex items-center gap-3 ${isSidebarOpen ? 'px-4' : 'justify-center'} py-3 rounded-xl text-sm font-bold transition-all duration-200 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${activeTab === 'workspace' ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 shadow-elevation-1 ring-1 ring-sky-200 dark:ring-sky-800' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'}`} 
                title="Dịch & Biên Tập"
              >
                <PenTool className="w-5 h-5 shrink-0" />
                {isSidebarOpen && <span className="flex-1 text-left whitespace-nowrap">Biên Tập & Dịch</span>}
                {isSidebarOpen && <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'workspace' ? 'bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{props.files.length}</span>}
              </button>

              <button 
                onClick={() => setActiveTab('knowledge')} 
                className={`w-full flex items-center gap-3 ${isSidebarOpen ? 'px-4' : 'justify-center'} py-3 rounded-xl text-sm font-bold transition-all duration-200 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${activeTab === 'knowledge' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shadow-elevation-1 ring-1 ring-amber-200 dark:ring-amber-800' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'}`} 
                title="Tri Thức & Ngữ Cảnh"
              >
                <BookOpen className="w-5 h-5 shrink-0" />
                {isSidebarOpen && <span className="whitespace-nowrap">Tri Thức & Ngữ Cảnh</span>}
              </button>

              <button 
                onClick={() => setActiveTab('dashboard')} 
                className={`w-full flex items-center gap-3 ${isSidebarOpen ? 'px-4' : 'justify-center'} py-3 rounded-xl text-sm font-bold transition-all duration-200 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${activeTab === 'dashboard' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 shadow-elevation-1 ring-1 ring-primary-200 dark:ring-primary-800' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'}`} 
                title="Thông Tin Truyện"
              >
                <LayoutDashboard className="w-5 h-5 shrink-0" />
                {isSidebarOpen && <span className="whitespace-nowrap">Thông Tin Truyện</span>}
              </button>
            </div>
          </div>
        </aside>

        {/* 3. Page Content */}
        <main className="flex-1 min-h-0 bg-slate-50 dark:bg-slate-950 relative overflow-hidden flex flex-col min-w-0">
          {activeTab === 'workspace' && <WorkspacePage {...props} />}
          {activeTab === 'knowledge' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-2 duration-300">
              <KnowledgePage {...props} handleDictionaryEnforce={props.handleDictionaryEnforce} />
            </div>
          )}
          {activeTab === 'dashboard' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-2 duration-300">
              <DashboardPage {...props} handleRestore={async (e) => { const success = await props.handleRestore(e); if (success) { setActiveTab('workspace'); props.setCurrentPage(1); } return success || false; }} handleResetQuota={props.handleManualResetQuota} />
            </div>
          )}
          
          {/* 4. GLOBAL BOTTOM ACTION BAR */}
          <div className="relative shrink-0 z-30">
            <button 
              onClick={() => setIsBottomBarOpen(!isBottomBarOpen)}
              className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 border border-b-0 border-slate-200 dark:border-slate-800 rounded-t-xl px-4 py-1 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 flex items-center justify-center transition-colors duration-200 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
            >
              {isBottomBarOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
            
            <div className={`bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] transition-all duration-300 overflow-x-auto custom-scrollbar ${isBottomBarOpen ? 'max-h-[40vh] opacity-100 p-1.5 md:p-3' : 'max-h-0 opacity-0 p-0'}`}>
              <div className="min-w-max mx-auto flex items-center gap-1.5 px-2 pb-1">
                
                {/* File Input & Paste */}
                <div className="flex items-center gap-1 shrink-0 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-1">
                  <label className="flex flex-col items-center justify-center min-w-[40px] h-[40px] px-1 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-all duration-200 cursor-pointer group active:scale-95 border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                    <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform mb-0.5" />
                    <span className="text-[9px] font-bold uppercase tracking-tight">Thêm</span>
                    <input type="file" multiple accept=".txt,.zip,.epub,.docx,.doc,.pdf" className="hidden" onChange={props.handleFileUpload} />
                  </label>
                  <button onClick={() => props.setShowPasteModal(true)} className="flex flex-col items-center justify-center min-w-[40px] h-[40px] px-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-all group active:scale-95">
                    <Clipboard className="w-3.5 h-3.5 group-hover:scale-110 transition-transform mb-0.5" />
                    <span className="text-[9px] font-bold uppercase tracking-tight">Paste</span>
                  </button>
                </div>
                
                <div className="w-1.5 shrink-0"></div>

                {/* System Tools */}
                <div className="flex items-center gap-1 shrink-0 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-1">
                  <button onClick={props.handleSaveSelected} className="action-btn text-slate-500 hover:text-emerald-600"><Save className="w-3.5 h-3.5 mb-0.5" /><span className="text-[9px] font-bold uppercase tracking-tight">Lưu DB</span></button>
                  <button onClick={props.handleBackup} className="action-btn text-slate-500 hover:text-primary-600"><Save className="w-3.5 h-3.5 mb-0.5" /><span className="text-[9px] font-bold uppercase tracking-tight">Backup</span></button>
                  <label className="flex flex-col items-center justify-center min-w-[40px] h-[40px] px-1 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-emerald-600 cursor-pointer group active:scale-95" title="Khôi phục">
                    <Upload className="w-3.5 h-3.5 group-hover:scale-110 transition-transform mb-0.5" />
                    <span className="text-[9px] font-bold uppercase tracking-tight">Restore</span>
                    <input type="file" accept=".json" className="hidden" onChange={async (e) => { const success = await props.handleRestore(e); if (success) { setActiveTab('workspace'); props.setCurrentPage(1); } }} />
                  </label>
                  <button onClick={props.requestResetApp} className="action-btn text-slate-500 hover:text-rose-600"><RotateCcw className="w-3.5 h-3.5 mb-0.5" /><span className="text-[9px] font-bold uppercase tracking-tight">Reset</span></button>
                </div>
                
                <div className="w-1.5 shrink-0"></div>
                
                {/* Selection Tools */}
                <div className="flex items-center gap-1 shrink-0 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-1">
                  <button onClick={props.selectAll} className="flex flex-col items-center justify-center min-w-[40px] h-[40px] px-1 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-primary-600 group active:scale-95" title="Chọn tất cả">
                    <CheckSquare className="w-3.5 h-3.5 mb-0.5 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-bold uppercase tracking-tight">All</span>
                  </button>
                  <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-1 h-[40px]">
                    <div className="flex flex-col items-center justify-center px-1">
                      <span className="text-[7px] font-bold text-slate-400 uppercase mb-0.5">Start</span>
                      <input type="number" placeholder="1" className="w-10 text-center text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded py-0.5 outline-none font-bold" value={props.rangeStart} onChange={(e) => props.setRangeStart(e.target.value)} />
                    </div>
                    <div className="px-0.5 text-slate-300 dark:text-slate-600"><ArrowRight className="w-3 h-3" /></div>
                    <div className="flex flex-col items-center justify-center px-1">
                      <span className="text-[7px] font-bold text-slate-400 uppercase mb-0.5">End</span>
                      <input type="number" placeholder="50" className="w-10 text-center text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded py-0.5 outline-none font-bold" value={props.rangeEnd} onChange={(e) => props.setRangeEnd(e.target.value)} />
                    </div>
                    <button onClick={props.handleRangeSelect} className="ml-1 w-6 h-6 bg-primary-50 dark:bg-primary-900/30 text-primary-600 rounded flex items-center justify-center shadow-sm" title="Chọn theo dải">
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="w-1.5 shrink-0"></div>

                {/* Edit & Maintenance Tools */}
                <div className="flex items-center gap-1 shrink-0 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-1">
                  <button onClick={() => props.setShowFindReplace(true)} className="action-btn text-slate-500 hover:text-sky-600"><Search className="w-3.5 h-3.5 mb-0.5" /><span className="text-[9px] font-bold uppercase tracking-tight">Tìm/Thay</span></button>
                  <button onClick={() => props.handleManualCleanup(props.selectedFiles.size > 0 ? 'selected' : 'all')} className="action-btn text-slate-500 hover:text-emerald-600"><Wand2 className="w-3.5 h-3.5 mb-0.5" /><span className="text-[9px] font-bold uppercase tracking-tight">Định Dạng</span></button>
                  <button onClick={() => setShowSplitConfig(true)} className={`action-btn ${showSplitConfig ? 'bg-primary-50 text-primary-600' : 'text-slate-500 hover:text-primary-600'}`}><Split className="w-3.5 h-3.5 mb-0.5" /><span className="text-[9px] font-bold uppercase tracking-tight">Tách Chương</span></button>
                  <button onClick={() => props.setShowFilterPanel(!props.showFilterPanel)} className={`action-btn ${props.showFilterPanel || props.filterModels.size > 0 || props.filterStatuses.size > 0 ? 'bg-primary-50 text-primary-600' : 'text-slate-500 hover:text-primary-600'}`}><ListFilter className="w-3.5 h-3.5 mb-0.5" /><span className="text-[9px] font-bold uppercase tracking-tight">Filter</span></button>
                  <button onClick={props.handleScanJunk} className="action-btn text-slate-500 hover:text-teal-600"><FileArchive className="w-3.5 h-3.5 mb-0.5" /><span className="text-[9px] font-bold uppercase tracking-tight">Lọc Rác</span></button>
                  <button onClick={() => props.handleRemoveDuplicates(props.selectedFiles.size > 0 ? 'selected' : 'all')} className="action-btn text-slate-500 hover:text-rose-600"><Eraser className="w-3.5 h-3.5 mb-0.5" /><span className="text-[9px] font-bold uppercase tracking-tight">Xóa Trùng</span></button>
                  <button onClick={() => props.selectedFiles.size > 0 ? props.handleSmartDelete() : props.requestDeleteAll()} className="action-btn text-slate-500 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5 mb-0.5" /><span className="text-[9px] font-bold uppercase tracking-tight">Xóa</span></button>
                </div>

                <div className="w-1.5 shrink-0"></div>

                {/* 4-STAGE PIPELINE ACTIONS */}
                <div className="flex items-center gap-1 shrink-0 bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/50 rounded-xl p-1">
                  <button 
                    onClick={() => props.handleTranslateOnly ? props.handleTranslateOnly(props.selectedFiles.size > 0 ? 'selected' : 'all') : props.handleStartButton()} 
                    disabled={props.isProcessing} 
                    className="action-btn text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/40"
                    title="Chạy riêng bước 1: Dịch thô"
                  >
                    <PenTool className="w-3.5 h-3.5 mb-0.5" />
                    <span className="text-[9px] font-bold uppercase tracking-tight">1. Dịch Thô</span>
                  </button>

                  <button 
                    onClick={() => props.handleReviewOnly ? props.handleReviewOnly(props.selectedFiles.size > 0 ? 'selected' : 'all') : {}} 
                    disabled={props.isProcessing} 
                    className="action-btn text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40"
                    title="Chạy riêng bước 2: Thẩm định Beta"
                  >
                    <Sparkles className="w-3.5 h-3.5 mb-0.5" />
                    <span className="text-[9px] font-bold uppercase tracking-tight">2. Thẩm Định</span>
                  </button>

                  <button 
                    onClick={() => props.handleEditOnly ? props.handleEditOnly(props.selectedFiles.size > 0 ? 'selected' : 'all') : {}} 
                    disabled={props.isProcessing} 
                    className="action-btn text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                    title="Chạy riêng bước 3: Biên tập Editor"
                  >
                    <Wand2 className="w-3.5 h-3.5 mb-0.5" />
                    <span className="text-[9px] font-bold uppercase tracking-tight">3. Biên Tập</span>
                  </button>

                  <button 
                    onClick={() => props.handleQAOnly ? props.handleQAOnly(props.selectedFiles.size > 0 ? 'selected' : 'all') : {}} 
                    disabled={props.isProcessing} 
                    className="action-btn text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/40"
                    title="Chạy riêng bước 4: Hậu kiểm QA & Sửa Hán tự"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 mb-0.5" />
                    <span className="text-[9px] font-bold uppercase tracking-tight">4. Hậu Kiểm</span>
                  </button>
                </div>

                <div className="w-1.5 shrink-0"></div>

                {/* Export & Primary Start */}
                <div className="flex items-center gap-1 shrink-0 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-1">
                  <button onClick={() => props.setShowRawDownloadModal(true)} className="action-btn text-slate-500 hover:text-sky-600"><FileDown className="w-3.5 h-3.5 mb-0.5" /><span className="text-[9px] font-bold uppercase tracking-tight">Raw</span></button>
                  <button onClick={props.handleDownloadTranslatedZip} className="action-btn text-slate-500 hover:text-primary-600"><FileArchive className="w-3.5 h-3.5 mb-0.5" /><span className="text-[9px] font-bold uppercase tracking-tight">Zip</span></button>
                  <button onClick={props.handleMergeSelected} className="action-btn text-slate-500 hover:text-emerald-600"><Layers className="w-3.5 h-3.5 mb-0.5" /><span className="text-[9px] font-bold uppercase tracking-tight">Gộp</span></button>
                  <button onClick={props.handleExportDocx} className="action-btn text-slate-500 hover:text-blue-600"><FileText className="w-3.5 h-3.5 mb-0.5" /><span className="text-[9px] font-bold uppercase tracking-tight">DOCX</span></button>
                  <button onClick={props.handleDownloadEpub} className="action-btn text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-900/20"><Book className="w-3.5 h-3.5 mb-0.5" /><span className="text-[9px] font-bold uppercase tracking-tight">EPUB</span></button>
                  
                  {/* FULL PIPELINE PLAY BUTTON */}
                  <button 
                    onClick={props.isProcessing ? props.stopProcessing : props.handleStartButton} 
                    className={`flex items-center gap-1.5 px-3.5 h-10 ml-1 rounded-xl shadow-elevation-2 font-bold text-white transition-all active:scale-95 ${
                      props.isProcessing 
                        ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200/50' 
                        : 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500'
                    }`}
                  >
                    {props.isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    <span className="text-xs">{props.isProcessing ? "DỪNG LẠI" : "DỊCH TOÀN BỘ"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* 5. MOBILE BOTTOM NAVIGATION */}
      <div className="lg:hidden flex-none bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe z-50 overflow-x-auto no-scrollbar">
        <div className="flex items-center justify-around gap-1 px-3 py-2 min-w-max px-safe">
          <button onClick={() => { setActiveTab('workspace'); props.setCurrentPage(1); }} className={`p-2 rounded-xl flex flex-col items-center gap-1 ${activeTab === 'workspace' ? 'text-sky-600 bg-sky-50 dark:bg-sky-900/30' : 'text-slate-400'}`}>
            <PenTool className="w-5 h-5" />
            <span className="text-[10px] font-bold">Biên Tập</span>
          </button>
          <button onClick={() => setActiveTab('knowledge')} className={`p-2 rounded-xl flex flex-col items-center gap-1 ${activeTab === 'knowledge' ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/30' : 'text-slate-400'}`}>
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] font-bold">Tri Thức</span>
          </button>
          <button onClick={() => setActiveTab('dashboard')} className={`p-2 rounded-xl flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/30' : 'text-slate-400'}`}>
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-bold">Thông Tin</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { 
  StartOptionsModal, GuideModal, 
  PasteModal, FindReplaceModal, ConfirmationModal, ImportModal, 
  ChangelogModal, LogModal
} from '../components/modals';
import { SplitterModal } from './SplitterModal';
import { EditorModal } from './EditorModal';
import { ZipActionModal } from './ZipActionModal';
import { EpubPreviewModal } from './EpubPreviewModal';
import { StoryInfo, FileItem, TranslationTier, LogEntry, EpubDesignOptions, EpubDesignAssets } from '../types';

interface ModalManagerProps {
  showPasteModal: boolean;
  setShowPasteModal: (v: boolean) => void;
  showFindReplace: boolean;
  setShowFindReplace: (v: boolean) => void;
  confirmModal: any;
  setConfirmModal: (v: any) => void;
  importModal: any;
  setImportModal: (v: any) => void;
  splitterModal: any;
  setSplitterModal: (v: any) => void;
  zipActionModal: boolean;
  setZipActionModal: (v: boolean, sourceType?: 'zip' | 'epub') => void;
  zipActionModalSourceType?: 'zip' | 'epub';
  handleZipKeepSeparate: () => void;
  handleZipMergeAndSplit: () => void;
  showGuide: boolean;
  setShowGuide: (v: boolean) => void;
  showStartOptions: boolean;
  setShowStartOptions: (v: boolean) => void;
  showChangelog: boolean;
  setShowChangelog: (v: boolean) => void;
  editingFileId: string | null;
  setEditingFileId: (v: string | null) => void;
  
  // EPUB Preview
  showEpubModal: boolean;
  setShowEpubModal: (v: boolean) => void;
  handleEpubConfirm: (info: StoryInfo, cover: File | null, font: File | null, designOptions?: EpubDesignOptions, designAssets?: EpubDesignAssets) => void;
  handleRegenerateCover?: (info: StoryInfo) => Promise<File | null>;
  
  // Logs
  showLogs: boolean;
  setShowLogs: (v: boolean) => void;
  systemLogs: LogEntry[];
  clearLogs: () => void;

  // Handlers & Data
  handlePasteConfirm: (title: string, content: string) => void;
  handleFindReplace: (pairs: {find: string, replace: string}[], scope: 'all' | 'selected') => void;
  selectedCount: number;
  handleImportAppend: () => void;
  handleImportOverwrite: () => void;
  handleSplitConfirm: (files: FileItem[]) => void;
  handleConfirmStart: (tier: TranslationTier) => void;
  storyInfo: StoryInfo;
  files: FileItem[];
  handleSaveFileContent: (fileId: string, newContent: string) => void;
  handleAutoSaveFileContent: (fileId: string, newContent: string) => void;
  additionalDictionary: string;
  promptTemplate: string;
  handleAddToGlossary: (raw: string, edit: string) => void;
  handleReplaceAllInFiles: (find: string, replace: string) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const ModalManager: React.FC<ModalManagerProps> = (props) => {
  const editingFile = props.editingFileId ? props.files.find(f => f.id === props.editingFileId) : null;
  const editingFileIndex = editingFile ? props.files.findIndex(f => f.id === editingFile.id) : -1;
  const hasNext = editingFileIndex >= 0 && editingFileIndex < props.files.length - 1;
  const hasPrev = editingFileIndex > 0;

  return (
    <>
      {/* 1. PASTE MODAL */}
      <PasteModal 
        isOpen={props.showPasteModal}
        onClose={() => props.setShowPasteModal(false)}
        onConfirm={props.handlePasteConfirm}
      />

      {/* 2. FIND / REPLACE MODAL */}
      <FindReplaceModal 
        isOpen={props.showFindReplace}
        onClose={() => props.setShowFindReplace(false)}
        onConfirm={props.handleFindReplace}
        selectedCount={props.selectedCount}
      />

      {/* 3. CONFIRMATION MODAL */}
      <ConfirmationModal 
        isOpen={props.confirmModal.isOpen}
        title={props.confirmModal.title}
        message={props.confirmModal.message}
        onClose={() => props.setConfirmModal({ ...props.confirmModal, isOpen: false })}
        onConfirm={props.confirmModal.onConfirm}
        isDanger={props.confirmModal.isDanger}
        confirmText={props.confirmModal.confirmText}
      />

      {/* 4. IMPORT MODAL */}
      <ImportModal 
        isOpen={props.importModal.isOpen}
        pendingFilesCount={props.importModal.pendingFiles?.length || 0}
        onClose={() => props.setImportModal({ isOpen: false, pendingFiles: [] })}
        onAppend={props.handleImportAppend}
        onOverwrite={props.handleImportOverwrite}
      />

      {/* 5. SPLITTER MODAL */}
      {props.splitterModal.isOpen && (
        <SplitterModal 
          isOpen={props.splitterModal.isOpen}
          onClose={() => props.setSplitterModal({ isOpen: false, content: '', name: '' })}
          content={props.splitterModal.content}
          fileName={props.splitterModal.name}
          onConfirm={props.handleSplitConfirm}
          isTranslatedImport={props.splitterModal.isTranslatedImport}
        />
      )}

      {/* 6. ZIP ACTION MODAL */}
      <ZipActionModal 
        isOpen={props.zipActionModal}
        sourceType={props.zipActionModalSourceType}
        onClose={() => props.setZipActionModal(false)}
        onKeepSeparate={props.handleZipKeepSeparate}
        onMergeAndSplit={props.handleZipMergeAndSplit}
      />

      {/* 7. GUIDE MODAL */}
      <GuideModal 
        isOpen={props.showGuide}
        onClose={() => props.setShowGuide(false)}
      />

      {/* 8. START OPTIONS MODAL */}
      <StartOptionsModal 
        isOpen={props.showStartOptions}
        onClose={() => props.setShowStartOptions(false)}
        onConfirm={props.handleConfirmStart}
        totalFiles={props.files.length}
        selectedFilesCount={props.selectedCount}
      />

      {/* 9. CHANGELOG MODAL */}
      <ChangelogModal 
        isOpen={props.showChangelog}
        onClose={() => props.setShowChangelog(false)}
      />

      {/* 10. SYSTEM LOGS MODAL */}
      <LogModal 
        isOpen={props.showLogs}
        onClose={() => props.setShowLogs(false)}
        logs={props.systemLogs}
        onClearLogs={props.clearLogs}
      />

      {/* 11. EPUB PREVIEW MODAL */}
      {props.showEpubModal && (
        <EpubPreviewModal 
          isOpen={props.showEpubModal}
          onClose={() => props.setShowEpubModal(false)}
          files={props.files}
          storyInfo={props.storyInfo}
          onConfirm={props.handleEpubConfirm}
          onRegenerateCover={props.handleRegenerateCover}
        />
      )}

      {/* 12. EDITOR MODAL (Multi-stage Inspector) */}
      {editingFile && (
        <EditorModal 
          file={editingFile}
          onClose={() => props.setEditingFileId(null)}
          onSave={props.handleSaveFileContent}
          onSaveAndNext={(id, content) => {
            props.handleSaveFileContent(id, content);
            if (hasNext) props.setEditingFileId(props.files[editingFileIndex + 1].id);
          }}
          onSaveAndPrev={(id, content) => {
            props.handleSaveFileContent(id, content);
            if (hasPrev) props.setEditingFileId(props.files[editingFileIndex - 1].id);
          }}
          onNext={() => hasNext && props.setEditingFileId(props.files[editingFileIndex + 1].id)}
          onPrev={() => hasPrev && props.setEditingFileId(props.files[editingFileIndex - 1].id)}
          hasNext={hasNext}
          hasPrev={hasPrev}
          onAutoSave={props.handleAutoSaveFileContent}
          storyInfoContext={props.storyInfo.contextNotes || ''}
          dictionary={props.additionalDictionary}
          promptTemplate={props.promptTemplate}
          onAddToGlossary={props.handleAddToGlossary}
          onReplaceAll={props.handleReplaceAllInFiles}
          addToast={props.addToast}
        />
      )}
    </>
  );
};

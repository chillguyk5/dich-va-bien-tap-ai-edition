import { useCleanupHandlers } from './appHandlers/useCleanupHandlers';
import { useDictionaryHandlers } from './appHandlers/useDictionaryHandlers';
import { useContextAnalysisHandlers } from './appHandlers/useContextAnalysisHandlers';
import { useFileListHandlers } from './appHandlers/useFileListHandlers';
import { useDownloadHandlers } from './appHandlers/useDownloadHandlers';
import { useUploadHandlers } from './appHandlers/useUploadHandlers';

export const useAppHandlers = (
  core: any,
  ui: any,
  fileHandler: any,
  engine: any
) => {
  const cleanup = useCleanupHandlers(core, ui);
  const dictionary = useDictionaryHandlers(core, ui);
  const contextAnalysis = useContextAnalysisHandlers(core, ui);
  const fileList = useFileListHandlers(core, ui);
  const download = useDownloadHandlers(core, ui);
  const upload = useUploadHandlers(core, ui, fileHandler);

  return {
    ...cleanup,
    ...dictionary,
    ...contextAnalysis,
    ...fileList,
    ...download,
    ...upload,
  };
};

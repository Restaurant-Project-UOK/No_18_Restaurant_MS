import { useState, useCallback, useRef } from 'react';
import { DownloadProgress } from '../types/download';

interface UseDownloadReturn {
  downloadFile: (url: string, filename: string) => Promise<void>;
  downloadMultiple: (
    files: Array<{ url: string; filename: string }>,
    onProgress?: (progress: DownloadProgress) => void
  ) => Promise<void>;
  progress: DownloadProgress;
  isDownloading: boolean;
  error: string | null;
  reset: () => void;
  cancel: () => void;
}

export const useDownload = (): UseDownloadReturn => {
  const [progress, setProgress] = useState<DownloadProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    isDownloading: false,
  });

  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const downloadFile = useCallback(
    async (url: string, filename: string): Promise<void> => {
      try {
        setError(null);

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to download: ${response.statusText}`);
        }

        const blob = await response.blob();
        const blobUrl = globalThis.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        globalThis.URL.revokeObjectURL(blobUrl);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  const downloadMultiple = useCallback(
    async (
      files: Array<{ url: string; filename: string }>,
      onProgress?: (progress: DownloadProgress) => void
    ): Promise<void> => {
      if (isDownloading) {
        return;
      }

      abortControllerRef.current = new AbortController();
      setIsDownloading(true);
      setError(null);

      const totalFiles = files.length;
      let completedCount = 0;
      let failedCount = 0;

      const newProgress: DownloadProgress = {
        total: totalFiles,
        completed: 0,
        failed: 0,
        isDownloading: true,
      };

      try {
        // Download files sequentially with stagger to avoid browser limits
        for (let i = 0; i < files.length; i++) {
          if (abortControllerRef.current?.signal.aborted) {
            break;
          }

          const { url, filename } = files[i];

          try {
            const response = await fetch(url, {
              signal: abortControllerRef.current?.signal,
            });

            if (!response.ok) {
              throw new Error(`Failed: ${response.statusText}`);
            }

            const blob = await response.blob();
            const blobUrl = globalThis.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            globalThis.URL.revokeObjectURL(blobUrl);

            completedCount++;
            newProgress.completed = completedCount;
          } catch (err) {
            failedCount++;
            newProgress.failed = failedCount;
            console.error(`Failed to download ${filename}:`, err);
          }

          // Update progress
          setProgress(newProgress);
          onProgress?.(newProgress);

          // Stagger downloads to avoid browser throttling
          if (i < files.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        }

        if (failedCount > 0) {
          setError(`${failedCount} file(s) failed to download`);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Download was cancelled or failed';
        setError(errorMessage);
      } finally {
        setIsDownloading(false);
        newProgress.isDownloading = false;
        setProgress(newProgress);
        onProgress?.(newProgress);
      }
    },
    [isDownloading]
  );

  const reset = useCallback(() => {
    setProgress({
      total: 0,
      completed: 0,
      failed: 0,
      isDownloading: false,
    });
    setError(null);
    setIsDownloading(false);
  }, []);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsDownloading(false);
  }, []);

  return {
    downloadFile,
    downloadMultiple,
    progress,
    isDownloading,
    error,
    reset,
    cancel,
  };
};

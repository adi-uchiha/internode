'use client';

import { useState, useCallback, useRef } from 'react';
import { uploadToCloudinary, CloudinaryError, resolveFolder } from '@/lib/cloudinary';
import type { UploadContext, FolderIds, CloudinaryUploadState } from '@/lib/cloudinary';

const INITIAL_STATE: CloudinaryUploadState = {
  status: 'idle',
  progress: 0,
  url: null,
  error: null,
};

/**
 * Generic hook for any Cloudinary upload context.
 *
 * Intentionally uses useState + useRef rather than useMutation because uploads
 * generate a URL that is then used by a separate server mutation (PATCH profile,
 * PATCH org, etc.) rather than being a mutation themselves.
 *
 * Usage:
 *   const { upload, state, reset } = useCloudinaryUpload('avatar', { userId });
 *   const url = await upload(file); // resolves to secure_url
 */
export function useCloudinaryUpload(context: UploadContext, folderIds: FolderIds) {
  const [state, setState] = useState<CloudinaryUploadState>(INITIAL_STATE);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastProgressRef = useRef(0);

  const upload = useCallback(
    async (file: File): Promise<string> => {
      // Cancel any in-flight upload
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      lastProgressRef.current = 0;

      setState({
        status: 'uploading',
        progress: 0,
        url: null,
        error: null,
      });

      try {
        const folder = resolveFolder(context, folderIds);
        const result = await uploadToCloudinary({
          context,
          folder,
          file,
          signal: controller.signal,
          onProgress: (percent) => {
            // Throttle to 5% increments to avoid excessive re-renders
            if (percent - lastProgressRef.current >= 5 || percent === 100) {
              lastProgressRef.current = percent;
              setState((prev) => ({ ...prev, progress: percent }));
            }
          },
        });

        setState({
          status: 'success',
          progress: 100,
          url: result.secure_url,
          error: null,
        });

        return result.secure_url;
      } catch (err) {
        const message =
          err instanceof CloudinaryError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Upload failed';

        setState({
          status: 'error',
          progress: 0,
          url: null,
          error: message,
        });

        throw err;
      }
    },
    [context, folderIds]
  );

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    lastProgressRef.current = 0;
    setState(INITIAL_STATE);
  }, []);

  return { upload, state, reset };
}

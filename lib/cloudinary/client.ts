import { cloudinaryConfig, MAX_UPLOAD_BYTES, ACCEPTED_MIME_TYPES } from './config';
import type { CloudinaryUploadOptions, CloudinaryUploadResult } from './types';

/** Typed error thrown for any Cloudinary failure, preserving HTTP status. */
export class CloudinaryError extends Error {
  public readonly status?: number;
  public readonly cloudinaryCode?: string;

  constructor(message: string, status?: number, cloudinaryCode?: string) {
    super(message);
    this.name = 'CloudinaryError';
    this.status = status;
    this.cloudinaryCode = cloudinaryCode;
  }
}

/**
 * Uploads a File directly to Cloudinary using XMLHttpRequest.
 *
 * Fetch is NOT used here because the Fetch API does not expose upload progress
 * events. XHR's `upload.onprogress` is required for the progress ring/bar UI.
 *
 * Security model:
 *   - Uses an unsigned upload preset (no API secret in the browser)
 *   - Folder path is passed as a FormData field (Cloudinary enforces it)
 *   - File type and size are validated before the request is sent
 */
export function uploadToCloudinary(
  options: CloudinaryUploadOptions
): Promise<CloudinaryUploadResult> {
  const { context, folder, file, onProgress, signal } = options;

  // ── Client-side validation ─────────────────────────────────────────────────

  const allowedTypes = ACCEPTED_MIME_TYPES[context];
  if (!allowedTypes.includes(file.type)) {
    return Promise.reject(
      new CloudinaryError(
        `Unsupported file type "${file.type}". Allowed: ${allowedTypes.join(', ')}`
      )
    );
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return Promise.reject(
      new CloudinaryError(
        `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.`
      )
    );
  }

  const preset = cloudinaryConfig.presets[context];
  if (!preset) {
    return Promise.reject(
      new CloudinaryError(`No upload preset configured for context "${context}"`)
    );
  }

  if (!cloudinaryConfig.cloudName) {
    return Promise.reject(
      new CloudinaryError(
        'Cloudinary cloud name is not configured. Check your environment variables.'
      )
    );
  }

  // ── XHR upload ────────────────────────────────────────────────────────────

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', preset);
    formData.append('folder', folder);

    const xhr = new XMLHttpRequest();
    let aborted = false;

    // Abort via signal
    const onAbort = () => {
      aborted = true;
      xhr.abort();
      reject(new CloudinaryError('Upload cancelled'));
    };

    if (signal) {
      if (signal.aborted) {
        reject(new CloudinaryError('Upload cancelled'));
        return;
      }
      signal.addEventListener('abort', onAbort);
    }

    const cleanup = () => {
      signal?.removeEventListener('abort', onAbort);
    };

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      cleanup();
      if (aborted) return;

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText) as CloudinaryUploadResult;
          // Cloudinary sometimes returns 200 with an error body
          if ('error' in result) {
            const err = (result as unknown as { error: { message: string } }).error;
            reject(new CloudinaryError(err.message, xhr.status));
          } else {
            resolve(result);
          }
        } catch {
          reject(new CloudinaryError('Invalid Cloudinary response — could not parse JSON'));
        }
      } else {
        let message = `Upload failed with HTTP ${xhr.status}`;
        try {
          const body = JSON.parse(xhr.responseText) as { error?: { message: string } };
          if (body.error?.message) message = body.error.message;
        } catch {
          /* ignore parse errors on error responses */
        }
        reject(new CloudinaryError(message, xhr.status));
      }
    });

    xhr.addEventListener('error', () => {
      cleanup();
      if (!aborted) reject(new CloudinaryError('Network error during upload'));
    });

    xhr.addEventListener('timeout', () => {
      cleanup();
      reject(new CloudinaryError('Upload timed out'));
    });

    xhr.timeout = 120_000; // 2 minute timeout
    xhr.open('POST', cloudinaryConfig.uploadEndpoint);
    xhr.send(formData);
  });
}

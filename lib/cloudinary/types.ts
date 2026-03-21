/**
 * Cloudinary Upload Types
 *
 * Minimal subset of the Cloudinary upload API response.
 * Only the fields we actually use are typed — avoids brittle full response typing.
 */

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  resource_type: 'image' | 'video' | 'raw';
  created_at: string;
}

/** The three upload surfaces in the app. */
export type UploadContext = 'avatar' | 'org-logo' | 'content';

export interface CloudinaryUploadOptions {
  /** Which surface is uploading — determines preset and folder. */
  context: UploadContext;
  /** Full Cloudinary folder path, e.g. "internode/users/uid123/avatar" */
  folder: string;
  file: File;
  /** Called repeatedly during upload, value 0–100. */
  onProgress?: (percent: number) => void;
  /** Optional: AbortSignal for cancellation support. */
  signal?: AbortSignal;
}

/** Reactive state exposed by useCloudinaryUpload. */
export interface CloudinaryUploadState {
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number;
  url: string | null;
  error: string | null;
}

/** Identity arguments used to resolve a folder path. */
export interface FolderIds {
  userId?: string;
  orgId?: string;
  ticketId?: string;
}

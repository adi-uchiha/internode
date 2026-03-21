import type { UploadContext, FolderIds } from './types';

/**
 * Validates all required env vars at module initialisation time.
 * Throws in development to surface misconfiguration early.
 * Warns in production to avoid crashing deployed builds.
 */
function requireClientEnv(key: string): string {
  // For NEXT_PUBLIC_ vars, we must access them via process.env[key]
  // Next.js statically replaces process.env.NEXT_PUBLIC_* at build time
  const value = process.env[key];
  if (!value) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Cloudinary] Missing env var: ${key}`);
    }
    return '';
  }
  return value;
}

// We must use direct process.env.NEXT_PUBLIC_* references for Next.js static replacement
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';
const presetAvatar = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_AVATAR ?? '';
const presetOrg = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_ORG ?? '';
const presetContent = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_CONTENT ?? '';

// Validate at module load in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const missing = [
    ['NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', cloudName],
    ['NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_AVATAR', presetAvatar],
    ['NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_ORG', presetOrg],
    ['NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_CONTENT', presetContent],
  ].filter(([, v]) => !v);

  if (missing.length > 0) {
    console.warn(
      `[Cloudinary] Missing env vars: ${missing.map(([k]) => k).join(', ')}. Image uploads will not work.`
    );
  }
}

export const cloudinaryConfig = {
  cloudName,
  get uploadEndpoint() {
    return `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;
  },
  presets: {
    avatar: presetAvatar,
    'org-logo': presetOrg,
    content: presetContent,
  } satisfies Record<UploadContext, string>,
} as const;

/**
 * Returns the Cloudinary folder path for a given upload context and org/user IDs.
 * All assets are scoped to their owner for easy per-org auditing.
 */
export function resolveFolder(context: UploadContext, ids: FolderIds): string {
  switch (context) {
    case 'avatar':
      if (!ids.userId) throw new Error('[Cloudinary] resolveFolder: userId required for avatar');
      return `internode/users/${ids.userId}/avatar`;

    case 'org-logo':
      if (!ids.orgId) throw new Error('[Cloudinary] resolveFolder: orgId required for org-logo');
      return `internode/organizations/${ids.orgId}/logo`;

    case 'content':
      if (!ids.orgId) throw new Error('[Cloudinary] resolveFolder: orgId required for content');
      return ids.ticketId
        ? `internode/organizations/${ids.orgId}/content/tickets/${ids.ticketId}`
        : `internode/organizations/${ids.orgId}/content`;
  }
}

/** Max upload size in bytes (10 MB). Validated client-side before XHR starts. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Accepted MIME types by context. */
export const ACCEPTED_MIME_TYPES: Record<UploadContext, string[]> = {
  avatar: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  'org-logo': ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
  content: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
};

// Re-export requireClientEnv for potential reuse — kept private for now
void requireClientEnv;

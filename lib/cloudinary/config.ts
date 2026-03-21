import type { UploadContext, FolderIds } from './types';
import {
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_AVATAR,
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_ORG,
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_CONTENT,
} from '@/lib/env';

export const cloudinaryConfig = {
  cloudName: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  get uploadEndpoint() {
    return `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;
  },
  presets: {
    avatar: NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_AVATAR,
    'org-logo': NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_ORG,
    content: NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_CONTENT,
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

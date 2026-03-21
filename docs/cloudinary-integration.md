# Cloudinary Image Upload — Technical Integration Plan

## Overview

Production-grade, modular Cloudinary integration for Internode. All uploads are
**direct browser-to-Cloudinary** via unsigned presets. Our API server **never
handles file bytes** — it only persists the resulting `secure_url` string.

### Three Upload Contexts

| #   | Context                          | DB Column                        | Preset               |
| --- | -------------------------------- | -------------------------------- | -------------------- |
| 1   | User profile picture             | `users.image`                    | `internode_avatar`   |
| 2   | Organization logo                | `organizations.logo`             | `internode_org_logo` |
| 3   | Markdown editor images (in-line) | Stored as markdown `![alt](url)` | `internode_content`  |

> [!NOTE]
> **No DB schema migrations are required.** Both `users.image` (`text`) and
> `organizations.logo` (`text`) already exist. Markdown images are embedded
> directly into `tickets.description` and `comments.content` as markdown text.

---

## Design Constraints

- ✅ **No Cloudinary Upload Widget** — 100 % custom UI only
- ✅ **Unsigned direct-to-Cloudinary** uploads from the browser
- ✅ **XHR-based** upload client (Fetch does not support upload progress events)
- ✅ **Progress feedback** on every upload surface
- ✅ **Optimistic cache updates** via `CacheManager` before persistence
- ✅ **Multiple concurrent uploads** in the markdown editor (paste multiple images)
- ✅ **Immediate local blob preview** before the Cloudinary response arrives
- ✅ **Backward-compatible** `MarkdownEditor` — image support is opt-in via prop
- ✅ **Full edge case handling** — MIME type, file size, network failure, invalid env

---

## Cloudinary Folder Hierarchy

All assets are stored in an org-scoped, context-aware folder structure:

```
internode/
├── users/
│   └── {userId}/
│       └── avatar/              ← profile pictures
└── organizations/
    └── {orgId}/
        ├── logo/                ← org logo
        └── content/             ← markdown images
            └── tickets/
                └── {ticketId}/ ← (when ticketId is known)
```

This makes per-org audits, storage reports, and cleanup trivial.

---

## Upload Presets (Cloudinary Dashboard)

Three **unsigned** presets must be created in the Cloudinary console:

| Preset Name          | Purpose         | Suggested Transformations                         |
| -------------------- | --------------- | ------------------------------------------------- |
| `internode_avatar`   | User avatar     | Face-detect crop, max 500×500, quality auto, WebP |
| `internode_org_logo` | Org logo        | Pad to 256×256, quality auto, PNG                 |
| `internode_content`  | Markdown images | Max width 2000px, quality auto                    |

---

## Environment Variables

Add to `.env` and **Vercel only** (see MCP scope section — Render excluded):

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_AVATAR=internode_avatar
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_ORG=internode_org_logo
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_CONTENT=internode_content
```

> [!IMPORTANT]
> All vars use the `NEXT_PUBLIC_` prefix because uploads occur entirely in the
> browser. The cloud name and unsigned preset names are **safe to expose publicly**
> — an unsigned preset is scoped to allow-listed MIME types and a max file size
> configured in the Cloudinary dashboard, not by a secret.

> [!NOTE]
> **Do NOT add these to the Render / MCP server.** The MCP server has no browser
> context, no `File` API, and no Cloudinary logic. It operates exclusively on text
> (markdown strings containing image URLs). See the MCP Scope section below.

---

## MCP Server Scope

The MCP server (`mcp/server.ts` on Render) **does not interact with Cloudinary**. This is a deliberate architecture decision:

- **Why excluded:** File/binary uploads require a browser `File` object and a
  live XHR connection. MCP tools operate over SSE with no such primitives.
- **What MCP CAN do:** Read and write `secure_url` strings as plain text. An AI
  agent can embed an already-hosted image in a ticket description by writing
  `![alt](https://res.cloudinary.com/...)` in the markdown field.
- **What MCP CANNOT do:** Accept a binary file payload, upload it to Cloudinary,
  or call the Cloudinary API in any way.
- **No env vars needed on Render** for this feature.

---

## Proposed Changes

---

### Layer 1 — Core Upload Library (`lib/cloudinary/`)

Three new files form the upload foundation. No other layer depends on them
directly except the React hooks below.

---

#### [NEW] `lib/cloudinary/types.ts`

```typescript
/**
 * Minimal subset of the Cloudinary upload API response.
 * Only the fields we actually use are typed — avoids brittle full response typing.
 */
export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string; // Always HTTPS CDN URL — the only value we persist
  width: number;
  height: number;
  format: string; // e.g. "jpg", "webp"
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
  progress: number; // 0–100
  url: string | null; // Set only on success
  error: string | null; // Human-readable error message on failure
}

/** Identity arguments used to resolve a folder path. */
export interface FolderIds {
  userId?: string;
  orgId?: string;
  ticketId?: string;
}
```

---

#### [NEW] `lib/cloudinary/config.ts`

```typescript
import { UploadContext, FolderIds } from './types';

/**
 * Validates all required env vars at module initialisation time.
 * Throws in development to surface misconfiguration early.
 * Warns in production to avoid crashing deployed builds.
 */
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    if (process.env.NODE_ENV === 'development') {
      throw new Error(`[Cloudinary] Missing required env var: ${key}`);
    }
    console.warn(`[Cloudinary] Missing env var: ${key}`);
    return '';
  }
  return value;
}

export const cloudinaryConfig = {
  cloudName: requireEnv('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME'),
  get uploadEndpoint() {
    return `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;
  },
  presets: {
    avatar: requireEnv('NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_AVATAR'),
    'org-logo': requireEnv('NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_ORG'),
    content: requireEnv('NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_CONTENT'),
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
```

---

#### [NEW] `lib/cloudinary/client.ts`

```typescript
import { cloudinaryConfig, MAX_UPLOAD_BYTES, ACCEPTED_MIME_TYPES } from './config';
import type { CloudinaryUploadOptions, CloudinaryUploadResult } from './types';

/** Typed error thrown for any Cloudinary failure, preserving HTTP status. */
export class CloudinaryError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly cloudinaryCode?: string
  ) {
    super(message);
    this.name = 'CloudinaryError';
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

  // ── XHR upload ────────────────────────────────────────────────────────────

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', preset);
    formData.append('folder', folder);

    const xhr = new XMLHttpRequest();

    // Abort via signal
    signal?.addEventListener('abort', () => {
      xhr.abort();
      reject(new CloudinaryError('Upload cancelled'));
    });

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText) as CloudinaryUploadResult;
          // Cloudinary sometimes returns 200 with an error body
          if ('error' in result && result.error) {
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
          /* ignore parse errors */
        }
        reject(new CloudinaryError(message, xhr.status));
      }
    });

    xhr.addEventListener('error', () => reject(new CloudinaryError('Network error during upload')));
    xhr.addEventListener('timeout', () => reject(new CloudinaryError('Upload timed out')));

    xhr.timeout = 120_000; // 2 minute timeout
    xhr.open('POST', cloudinaryConfig.uploadEndpoint);
    xhr.send(formData);
  });
}
```

---

#### [NEW] `hooks/useCloudinaryUpload.ts`

```typescript
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
export function useCloudinaryUpload(
  context: UploadContext,
  folderIds: FolderIds
): {
  upload: (file: File) => Promise<string>;
  state: CloudinaryUploadState;
  reset: () => void;
};
```

Key implementation details:

- `upload(file)` → calls `resolveFolder` + `uploadToCloudinary`, updates state via `setState`
- `state.progress` fires on every XHR progress event (throttled to 5% increments)
- On success: `state.status = 'success'`, `state.url = secure_url`
- On error: `state.status = 'error'`, `state.error = CloudinaryError.message`
- `reset()` → returns state to `'idle'` so the component can be reused

---

### Layer 2 — Profile Picture Upload

**Audit finding:** `user.image` is currently rendered (read-only, no upload) in **9 places**:

| File                                         | Location                 | Notes                                      |
| -------------------------------------------- | ------------------------ | ------------------------------------------ |
| `components/layouts/DashboardLayout.tsx:272` | Sidebar bottom user area | `36×36` circle                             |
| `app/tasks/profile/page.tsx:92`              | Profile header           | `96×96` circle, **primary upload surface** |
| `app/tasks/members/page.tsx:510`             | Member cards grid        | `52×52` circles                            |
| `app/tasks/ticket/[id]/page.tsx:337`         | Assignee chip            | `16×16`                                    |
| `app/tasks/ticket/[id]/page.tsx:489`         | Time log row             | `24×24`                                    |
| `app/tasks/ticket/[id]/page.tsx:552`         | Comment author           | `40×40`                                    |
| `app/tasks/leaves/page.tsx:108`              | Leave request row        | Avatar                                     |
| `app/tasks/breakthroughs/page.tsx:88,115`    | Breakthrough cards       | Avatar                                     |
| `app/tasks/onboarding/page.tsx:195`          | Onboarding header        | Avatar                                     |

After implementing `AvatarUpload`, all of these surfaces benefit automatically
because they read from `user.image` in React Query cache — no individual changes needed.

---

#### [NEW] `components/shared/AvatarUpload.tsx`

```
Props:
  currentImageUrl?: string | null   — initial Cloudinary or OAuth URL
  userId: string                    — used to resolve folder path
  size?: 'sm' | 'md' | 'lg'        — sm=36px, md=64px, lg=96px (default: 'md')
  onUploadComplete: (url: string) => void
  className?: string

Behavior:
  - Renders a circular avatar with a translucent "Change Photo" hover overlay
  - Click anywhere on the circle opens a hidden <input type="file" accept="image/*">
  - Drag-drop onto the circle also accepted
  - FileReader creates an immediate blob:// preview BEFORE Cloudinary responds
  - A circular SVG progress ring animates around the avatar during upload
  - On success: calls onUploadComplete(url), which the parent uses to call
    useUpdateProfile mutation → persists to DB + updates React Query cache
  - On error: toast.error(CloudinaryError.message), reverts to previous image
  - MIME and size errors are caught before upload starts (no network request made)
  - Keyboard accessible: Enter/Space triggers file picker
  - aria-label: "Upload profile picture"
```

---

#### [MODIFY] `app/tasks/profile/page.tsx`

**Current state:** Avatar is a static `<Image>` or icon fallback. No upload interactivity.

**Change:** Replace the static 96×96 avatar `<div>` at line 91–107 with `<AvatarUpload>`.
The `onUploadComplete` callback calls `useUpdateProfile` with `{ image: url }`.

```diff
- <div className="relative">
-   {user?.image ? (
-     <Image src={user.image} ... />
-   ) : (
-     <div className="...fallback..." />
-   )}
-   <div className="...online-dot..." />
- </div>
+ <AvatarUpload
+   currentImageUrl={user?.image}
+   userId={user!.id}
+   size="lg"
+   onUploadComplete={(url) => updateProfileMutation.mutate({ image: url })}
+ />
```

The `useUpdateProfile` mutation already calls
`CacheManager.users.softSwapImage(queryClient, userId, url)` which propagates the
new avatar to all 9 render surfaces above via the React Query cache.

---

#### [MODIFY] `app/api/users/profile/route.ts`

**Current state:** PATCH handles `name`, `department`, `notificationSettings`, `skillTags`.
The `image` field is destructured but never written to the DB.

**Change:** Add `image` to the `db.update(users).set(...)` call:

```typescript
// Validate it's a Cloudinary URL before persisting
const CLOUDINARY_URL_PREFIX = 'https://res.cloudinary.com/';

await db
  .update(users)
  .set({
    name,
    image: image?.startsWith(CLOUDINARY_URL_PREFIX) ? image : undefined,
    notificationSettings,
    updatedAt: new Date(),
  })
  .where(eq(users.id, session!.user.id));
```

Note: `lib/auth.ts` declares `image` as part of the better-auth user schema via
`drizzleAdapter` which maps to `users.image`. No changes to `lib/auth.ts` needed.

---

#### [MODIFY] `hooks/useUsers.ts`

**Current state:** `useUpdateProfile` PATCH body includes name, department, etc.
The `image` field is already used in `onMutate` for `softSwapImage`, but it's not
sent to the server.

**Change:** Include `image` in the `mutationFn` PATCH payload so the route
actually persists it:

```diff
mutationFn: (profile: Partial<User>) =>
-  apiClient.patch<User>('/api/users/profile', { name, department, notificationSettings, skillTags }),
+  apiClient.patch<User>('/api/users/profile', profile),
```

---

### Layer 3 — Organization Logo Upload

**Audit finding:** The settings page (`app/tasks/settings/page.tsx`) contains a
"General" section with organization name and branding color fields — **no logo
field exists today**. The `organizations.logo` column in the DB is populated by
better-auth when an org is created but never surfaced in the UI.

---

#### [NEW] `components/shared/LogoUpload.tsx`

```
Props:
  currentLogoUrl?: string | null
  orgId: string
  onUploadComplete: (url: string) => void
  className?: string

Behavior:
  - Rounded square container (not circle), default 80×80px
  - Shows org logo image or a building icon fallback
  - Hover: translucent "Change Logo" overlay with upload icon
  - Click or drag-drop to upload
  - Progress bar beneath the logo square (not a ring — logos are less personal)
  - Accepts JPEG, PNG, WebP, SVG
  - On success: calls onUploadComplete(url)
  - Role guard: component must only be rendered when orgRole is 'owner' or 'admin'
    (the parent settings page already gates the whole section)
```

---

#### [MODIFY] `app/tasks/settings/page.tsx`

**Current state:** "General" section has Organization Name and Branding Color fields.
No logo field. Save button calls a stub `handleSave` that simulates an API call.

**Changes:**

1. Add a `LogoUpload` component at the top of the "General" card (before the name field)
2. Wire the existing name/slug fields to `useUpdateOrganization` (currently they're uncontrolled inputs with no API integration)
3. Wire the `LogoUpload.onUploadComplete` → `useUpdateOrganizationLogo` mutation
4. Replace the stub `handleSave` with real API calls

```
New layout of the General card:
  ┌─────────────────────────────────────────────┐
  │ [LogoUpload 80×80]  Organization Logo       │
  │                                             │
  │ Organization Name: [Input]                  │
  │ Slug / Domain:     [Input]                  │
  │ Branding Color:    [ColorPicker + Input]    │
  └─────────────────────────────────────────────┘
```

---

#### [NEW] `lib/cache/domains/organizations.ts`

```typescript
/**
 * Cache domain for Organization-level optimistic updates.
 * Mirrors the pattern of UserDomain in lib/cache/domains/users.ts.
 */
export const OrganizationDomain = {
  /**
   * Optimistically swaps the org logo URL across all relevant cache entries.
   * Called before the PATCH request so the UI feels instant.
   */
  softSwapLogo: (queryClient: QueryClient, orgId: string, newLogoUrl: string) => {
    // 1. Update the active org details query
    queryClient.setQueryData(
      ['active-organization-details'],
      (old: OrganizationDetails | undefined) => (old ? { ...old, logo: newLogoUrl } : old)
    );
    // 2. Update the list-organizations query (used by OrgSwitcher)
    queryClient.setQueryData(
      ['list-organizations'],
      (old: Organization[] | undefined) =>
        old?.map((o) => (o.id === orgId ? { ...o, logo: newLogoUrl } : o)) ?? old
    );
  },

  /**
   * Full org details sync — used by onSettled after the PATCH completes.
   */
  sync: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({
      queryKey: ['active-organization-details'],
      refetchType: 'none',
    });
    queryClient.invalidateQueries({ queryKey: ['list-organizations'], refetchType: 'none' });
  },
};
```

---

#### [MODIFY] `lib/cache/manager.ts`

```diff
+ import { OrganizationDomain } from './domains/organizations';

  export const CacheManager = {
    tickets: TicketDomain,
    analytics: AnalyticsDomain,
    projects: ProjectDomain,
    users: UserDomain,
    activities: ActivityDomain,
    notifications: NotificationDomain,
    search: SearchDomain,
    invites: InviteDomain,
    breakthroughs: BreakthroughDomain,
+   organizations: OrganizationDomain,
    dispatch: dispatchSynergy,
  };
```

---

#### [MODIFY] `hooks/useOrganization.ts`

Add `useUpdateOrganizationLogo` mutation alongside the existing
`useUpdateOrganization`:

```typescript
/**
 * Mutation to upload and persist a new org logo.
 * Uses optimistic update via CacheManager so the sidebar and settings page
 * reflect the new logo immediately, with fallback on error.
 */
export function useUpdateOrganizationLogo() {
  const queryClient = useQueryClient();
  const { activeOrgId } = useAuth();

  return useMutation({
    mutationFn: (logoUrl: string) => apiClient.patch('/api/organization', { logo: logoUrl }),

    onMutate: async (logoUrl) => {
      await queryClient.cancelQueries({ queryKey: ['active-organization-details'] });
      const previous = queryClient.getQueryData(['active-organization-details']);
      CacheManager.organizations.softSwapLogo(queryClient, activeOrgId!, logoUrl);
      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['active-organization-details'], context.previous);
      }
    },

    onSettled: () => CacheManager.organizations.sync(queryClient),
  });
}
```

---

#### [MODIFY] `app/api/organization/route.ts`

Extend PATCH to accept and validate `logo`:

```typescript
const { organizationName, organizationDomain, logo } = body;

const CLOUDINARY_URL_PREFIX = 'https://res.cloudinary.com/';

await db
  .update(organizations)
  .set({
    name: organizationName,
    slug: organizationDomain,
    logo: logo?.startsWith(CLOUDINARY_URL_PREFIX) ? logo : undefined,
    updatedAt: new Date(),
  })
  .where(eq(organizations.id, orgId));
```

Role guard `{ requiredRole: ['owner', 'admin'] }` already present — no change needed.

---

#### [MODIFY] `lib/cache/augmenter.ts`

Add org logo resolver (used by `OrgSwitcher` and other org-aware components):

```typescript
orgLogo: (queryClient: QueryClient, orgId: string): string | null => {
  const orgDetails = queryClient.getQueryData<OrganizationDetails>(
    ['active-organization-details']
  );
  if (orgDetails?.id === orgId) return orgDetails.logo ?? null;

  // Fall back to the list cache
  const orgs = queryClient.getQueryData<Organization[]>(['list-organizations']);
  return orgs?.find((o) => o.id === orgId)?.logo ?? null;
},
```

---

### Layer 4 — Markdown Editor Image Upload

**Audit findings:**

- `MarkdownEditor` is used in **two places**:
  1. `app/tasks/ticket/new/page.tsx:256` — ticket creation form
  2. `app/tasks/ticket/[id]/page.tsx:408` — ticket detail **edit mode only**
- Comments section uses a plain `<Textarea>`, **not** `MarkdownEditor` — image upload is out of scope for comments at this stage.
- The editor is a controlled textarea with an `insertMarkdown` helper already defined — the paste and file-picker handlers follow the same pattern.

---

#### [MODIFY] `components/shared/MarkdownEditor.tsx`

**New optional prop** (fully backward-compatible — both existing usages will continue to work without changes until explicitly updated):

```typescript
interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  showPreview?: boolean;
  /**
   * When provided, enables image upload via paste and toolbar button.
   * When absent, the image toolbar button is hidden and paste falls through normally.
   */
  uploadContext?: {
    orgId: string;
    ticketId?: string; // optional — used to scope folder path
  };
}
```

**Three additions inside the component:**

**A — Paste Handler**

Attached to `onPaste` on the `<textarea>`:

```typescript
// Runs for every paste. If no image items found, falls through to default paste.
// Multiple images in a single paste are uploaded concurrently.
// Each image gets its own placeholder replaced independently when done.

const handlePaste = useCallback(
  async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (!uploadContext) return; // no upload context → normal paste

    const imageItems = Array.from(e.clipboardData.items).filter((item) =>
      item.type.startsWith('image/')
    );

    if (imageItems.length === 0) return; // let normal text paste proceed

    e.preventDefault();

    for (const item of imageItems) {
      const file = item.getAsFile();
      if (!file) continue;

      const placeholderId = `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const placeholderToken = `![Uploading...][${placeholderId}]`;

      // Insert placeholder at cursor using existing insertAtCursor logic
      insertAtCursor(placeholderToken);
      setUploadingCount((c) => c + 1);

      const folder = resolveFolder('content', {
        orgId: uploadContext.orgId,
        ticketId: uploadContext.ticketId,
      });

      uploadToCloudinary({ context: 'content', folder, file })
        .then((result) => {
          // Replace the placeholder token with the real markdown image
          onChange(value.replace(placeholderToken, `![image](${result.secure_url})`));
        })
        .catch((err: CloudinaryError) => {
          onChange(value.replace(placeholderToken, `![upload failed — ${err.message}][]`));
          toast.error(`Image upload failed: ${err.message}`);
        })
        .finally(() => setUploadingCount((c) => c - 1));
    }
  },
  [uploadContext, value, onChange, insertAtCursor]
);
```

**B — Image Toolbar Button**

Added AFTER the last separator in `toolbarButtons`, only rendered when `uploadContext` is set:

```typescript
// In the toolbar JSX, after the existing buttons:
{uploadContext && (
  <>
    <div className="w-px h-5 bg-border mx-1" />
    <button
      onClick={() => fileInputRef.current?.click()}
      title="Upload Image"
      className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors relative"
    >
      <Icon icon="solar:gallery-add-linear" className="w-4 h-4" />
      {uploadingCount > 0 && (
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-primary text-primary-foreground text-[8px] rounded-full flex items-center justify-center font-bold">
          {uploadingCount}
        </span>
      )}
    </button>
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      multiple
      className="hidden"
      onChange={handleFileInputChange}
    />
  </>
)}
```

**C — Upload Status Bar**

Shown beneath the toolbar when `uploadingCount > 0`:

```typescript
{uploadingCount > 0 && (
  <div className="px-3 py-1.5 bg-primary/5 border-b border-primary/20 flex items-center gap-2">
    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
    <span className="font-mono text-[10px] text-primary uppercase tracking-widest">
      Uploading {uploadingCount} image{uploadingCount > 1 ? 's' : ''}...
    </span>
  </div>
)}
```

---

#### [MODIFY] `app/tasks/ticket/new/page.tsx`

Pass `uploadContext` to the `MarkdownEditor` (the page already has `useAuth` for `activeOrgId`):

```diff
- <MarkdownEditor value={description} onChange={setDescription} minHeight="350px" />
+ <MarkdownEditor
+   value={description}
+   onChange={setDescription}
+   minHeight="350px"
+   uploadContext={{ orgId: activeOrgId! }}
+ />
```

Note: No `ticketId` is available at creation time — images are scoped to
`internode/organizations/{orgId}/content/` (without ticket sub-folder).

---

#### [MODIFY] `app/tasks/ticket/[id]/page.tsx`

Pass `uploadContext` to the `MarkdownEditor` in edit mode (at line 408).
`ticket.id` is already available in scope:

```diff
- <MarkdownEditor
-   value={editForm.description || ''}
-   onChange={(val) => setEditForm({ ...editForm, description: val })}
-   minHeight="400px"
- />
+ <MarkdownEditor
+   value={editForm.description || ''}
+   onChange={(val) => setEditForm({ ...editForm, description: val })}
+   minHeight="400px"
+   uploadContext={{ orgId: ticket.organizationId, ticketId: ticket.id }}
+ />
```

---

## Files Summary

| Action       | File                                                                               |
| ------------ | ---------------------------------------------------------------------------------- |
| **[NEW]**    | `lib/cloudinary/types.ts`                                                          |
| **[NEW]**    | `lib/cloudinary/config.ts`                                                         |
| **[NEW]**    | `lib/cloudinary/client.ts`                                                         |
| **[NEW]**    | `hooks/useCloudinaryUpload.ts`                                                     |
| **[NEW]**    | `components/shared/AvatarUpload.tsx`                                               |
| **[NEW]**    | `components/shared/LogoUpload.tsx`                                                 |
| **[NEW]**    | `lib/cache/domains/organizations.ts`                                               |
| **[MODIFY]** | `app/tasks/profile/page.tsx` — replace static avatar with `AvatarUpload`           |
| **[MODIFY]** | `app/tasks/settings/page.tsx` — add `LogoUpload`, wire existing fields to API      |
| **[MODIFY]** | `app/tasks/ticket/new/page.tsx` — pass `uploadContext` to `MarkdownEditor`         |
| **[MODIFY]** | `app/tasks/ticket/[id]/page.tsx` — pass `uploadContext` to `MarkdownEditor`        |
| **[MODIFY]** | `app/api/users/profile/route.ts` — accept + validate `image` field                 |
| **[MODIFY]** | `app/api/organization/route.ts` — accept + validate `logo` field                   |
| **[MODIFY]** | `hooks/useUsers.ts` — pass full profile object (including `image`) to PATCH        |
| **[MODIFY]** | `hooks/useOrganization.ts` — add `useUpdateOrganizationLogo` mutation              |
| **[MODIFY]** | `lib/cache/manager.ts` — register `OrganizationDomain`                             |
| **[MODIFY]** | `lib/cache/augmenter.ts` — add `orgLogo` resolver                                  |
| **[MODIFY]** | `components/shared/MarkdownEditor.tsx` — paste handler, toolbar button, status bar |
| **[MODIFY]** | `.env` + Vercel env vars (**Render/MCP excluded**)                                 |

---

## Verification Plan

### Automated Checks

```bash
bun run tsc --noEmit  # Catch type errors in new lib/cloudinary/* and hooks
bun run lint          # ESLint + Prettier
bun run build         # Catch SSR/client boundary issues in Next.js build
```

### Manual Verification

**Profile Picture**

1. Go to `tasks/profile` → click the 96×96 avatar area
2. Pick a JPEG → progress ring animates around the circle
3. Immediate blob preview appears before Cloudinary responds
4. After upload: swaps to Cloudinary URL (`https://res.cloudinary.com/...`)
5. Sidebar avatar (DashboardLayout), member cards, ticket assignee chips all update **without page reload** (React Query cache propagation)
6. Check Cloudinary Media Library → `internode/users/{userId}/avatar/`
7. Try uploading a PDF → toast error, no upload initiated
8. Try uploading a >10 MB file → toast error, no network request made

**Organization Logo** (as owner or admin)

1. Go to `tasks/settings` → "General" section → click logo area
2. Drag-drop a PNG → progress bar beneath logo, immediate preview
3. Save → logo persists after page refresh
4. Log in as `member` role → logo upload area not rendered (role guard)
5. Check Cloudinary → `internode/organizations/{orgId}/logo/`

**Markdown Editor — Paste**

1. Open `tasks/ticket/new` → click in the description editor
2. Press Ctrl+Shift+PrtSc (Linux) to copy a screenshot
3. Ctrl+V in the editor → `![Uploading...][img-xxx]` placeholder appears
4. After upload → replaced with `![image](https://res.cloudinary.com/...)`
5. Split/Preview pane shows the image inline
6. Paste 3 images simultaneously → all 3 upload concurrently, each with its own placeholder
7. Open an existing ticket → enter edit mode → same behavior in the edit editor

**Markdown Editor — Toolbar Button**

1. Click the `solar:gallery-add-linear` icon in the markdown toolbar
2. File picker opens with `image/*` filter
3. Select multiple images → same placeholder → completion flow

**Error Handling**

1. Upload `.pdf` file → rejected with clear error before upload starts
2. Upload >10 MB image → rejected client-side (no network request)
3. DevTools → Network → Offline → paste image → `![upload failed — Network error...][]`
   appears in the editor gracefully
4. Check that non-Cloudinary URLs are rejected by the API (direct DB manipulation attempt)

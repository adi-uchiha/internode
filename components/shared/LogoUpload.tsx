'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';
import { ACCEPTED_MIME_TYPES, MAX_UPLOAD_BYTES, CloudinaryError } from '@/lib/cloudinary';
import { toast } from '@/lib/toast';

interface LogoUploadProps {
  currentLogoUrl?: string | null;
  orgId: string;
  onUploadComplete: (url: string) => void;
  className?: string;
}

/**
 * Rounded-square logo upload with progress bar.
 *
 * Features:
 * - Click/drag-drop to pick an image
 * - Immediate blob preview before Cloudinary responds
 * - Linear progress bar beneath the logo during upload
 * - Error handling with toast and rollback
 * - Accepts JPEG, PNG, WebP, SVG
 */
export function LogoUpload({
  currentLogoUrl,
  orgId,
  onUploadComplete,
  className,
}: LogoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const { upload, state, reset } = useCloudinaryUpload('org-logo', { orgId });

  const handleFile = useCallback(
    async (file: File) => {
      const allowedTypes = ACCEPTED_MIME_TYPES['org-logo'];
      if (!allowedTypes.includes(file.type)) {
        toast.error(
          `Unsupported file type. Allowed: ${allowedTypes.map((t) => t.split('/')[1]).join(', ')}`
        );
        return;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        toast.error(
          `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.`
        );
        return;
      }

      const blobUrl = URL.createObjectURL(file);
      setPreviewUrl(blobUrl);

      try {
        const url = await upload(file);
        onUploadComplete(url);
        URL.revokeObjectURL(blobUrl);
      } catch (err) {
        setPreviewUrl(null);
        URL.revokeObjectURL(blobUrl);
        const message = err instanceof CloudinaryError ? err.message : 'Failed to upload logo';
        toast.error(message);
        reset();
      }
    },
    [upload, onUploadComplete, reset]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = '';
    },
    [handleFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const displayUrl = previewUrl ?? currentLogoUrl;
  const isUploading = state.status === 'uploading';

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative inline-block group">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'relative w-20 h-20 rounded-lg overflow-hidden cursor-pointer',
            'border-2 border-border hover:border-primary/50',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'transition-all duration-200',
            isDragOver && 'border-primary ring-2 ring-primary/20'
          )}
          aria-label="Upload organization logo"
        >
          {displayUrl ? (
            <Image
              src={displayUrl}
              alt="Organization logo"
              width={80}
              height={80}
              className="w-full h-full object-contain bg-white p-1"
              unoptimized={displayUrl.startsWith('blob:')}
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Icon icon="solar:buildings-bold-duotone" className="w-8 h-8 text-muted-foreground" />
            </div>
          )}

          {/* Hover overlay */}
          <div
            className={cn(
              'absolute inset-0 bg-black/50 flex flex-col items-center justify-center',
              'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
              isUploading && 'opacity-100'
            )}
          >
            {isUploading ? (
              <span className="font-mono text-[8px] text-white uppercase tracking-widest">
                {state.progress}%
              </span>
            ) : (
              <>
                <Icon icon="solar:upload-linear" className="w-5 h-5 text-white mb-0.5" />
                <span className="font-mono text-[7px] text-white uppercase tracking-wider">
                  Change
                </span>
              </>
            )}
          </div>
        </button>
      </div>

      {/* Progress bar beneath the logo */}
      {isUploading && (
        <div className="w-20 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-200 rounded-full"
            style={{ width: `${state.progress}%` }}
          />
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleFileInput}
        tabIndex={-1}
      />
    </div>
  );
}

'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';
import { ACCEPTED_MIME_TYPES, MAX_UPLOAD_BYTES, CloudinaryError } from '@/lib/cloudinary';
import { toast } from '@/lib/toast';

const SIZE_MAP = {
  sm: { container: 36, icon: 16, ring: 40, strokeWidth: 2 },
  md: { container: 64, icon: 28, ring: 68, strokeWidth: 2.5 },
  lg: { container: 96, icon: 40, ring: 100, strokeWidth: 3 },
} as const;

type AvatarSize = keyof typeof SIZE_MAP;

interface AvatarUploadProps {
  currentImageUrl?: string | null;
  userId: string;
  size?: AvatarSize;
  onUploadComplete: (url: string) => void;
  className?: string;
}

/**
 * Circular avatar with upload support.
 *
 * Features:
 * - Click/drag-drop/keyboard to pick an image
 * - Immediate blob preview before Cloudinary responds
 * - SVG progress ring during upload
 * - Error handling with toast and rollback
 */
export function AvatarUpload({
  currentImageUrl,
  userId,
  size = 'md',
  onUploadComplete,
  className,
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const { upload, state, reset } = useCloudinaryUpload('avatar', { userId });
  const dims = SIZE_MAP[size];

  const handleFile = useCallback(
    async (file: File) => {
      // Client-side validation before creating preview
      const allowedTypes = ACCEPTED_MIME_TYPES.avatar;
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

      // Create immediate blob preview
      const blobUrl = URL.createObjectURL(file);
      setPreviewUrl(blobUrl);

      try {
        const url = await upload(file);
        onUploadComplete(url);
        // Clean up the blob URL after success
        URL.revokeObjectURL(blobUrl);
      } catch (err) {
        // Revert to previous image on error
        setPreviewUrl(null);
        URL.revokeObjectURL(blobUrl);
        const message = err instanceof CloudinaryError ? err.message : 'Failed to upload image';
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
      // Reset the input so the same file can be selected again
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

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  }, []);

  const displayUrl = previewUrl ?? currentImageUrl;
  const isUploading = state.status === 'uploading';

  // SVG progress ring
  const ringRadius = (dims.ring - dims.strokeWidth) / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (state.progress / 100) * ringCircumference;

  return (
    <div className={cn('relative inline-block group', className)}>
      {/* Clickable avatar area */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative rounded-full overflow-hidden cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'transition-all duration-200',
          isDragOver && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
        )}
        style={{ width: dims.container, height: dims.container }}
        aria-label="Upload profile picture"
      >
        {displayUrl ? (
          <Image
            src={displayUrl}
            alt="Profile picture"
            width={dims.container}
            height={dims.container}
            className="w-full h-full object-cover"
            unoptimized={displayUrl.startsWith('blob:')}
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center border-2 border-border">
            <Icon
              icon="solar:user-bold-duotone"
              className="text-muted-foreground"
              style={{ width: dims.icon, height: dims.icon }}
            />
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
              <Icon icon="solar:camera-linear" className="w-4 h-4 text-white mb-0.5" />
              <span className="font-mono text-[7px] text-white uppercase tracking-wider">
                Change
              </span>
            </>
          )}
        </div>
      </button>

      {/* SVG Progress Ring (shown during upload) */}
      {isUploading && (
        <svg
          className="absolute inset-0 -rotate-90 pointer-events-none"
          style={{
            width: dims.ring,
            height: dims.ring,
            top: -(dims.ring - dims.container) / 2,
            left: -(dims.ring - dims.container) / 2,
          }}
        >
          {/* Background ring */}
          <circle
            cx={dims.ring / 2}
            cy={dims.ring / 2}
            r={ringRadius}
            fill="none"
            stroke="currentColor"
            strokeWidth={dims.strokeWidth}
            className="text-muted/30"
          />
          {/* Progress ring */}
          <circle
            cx={dims.ring / 2}
            cy={dims.ring / 2}
            r={ringRadius}
            fill="none"
            stroke="currentColor"
            strokeWidth={dims.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={ringCircumference}
            strokeDashoffset={ringOffset}
            className="text-primary transition-[stroke-dashoffset] duration-200"
          />
        </svg>
      )}

      {/* Online indicator (only visible when not uploading) */}
      {!isUploading && (
        <div
          className="absolute bottom-0 right-0 rounded-full bg-primary border-4 border-card flex items-center justify-center"
          style={{
            width: Math.max(dims.container * 0.25, 12),
            height: Math.max(dims.container * 0.25, 12),
          }}
        >
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileInput}
        tabIndex={-1}
      />
    </div>
  );
}

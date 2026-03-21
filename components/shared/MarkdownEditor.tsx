'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { cn } from '@/lib/utils';
import { uploadToCloudinary, CloudinaryError, resolveFolder } from '@/lib/cloudinary';
import { toast } from '@/lib/toast';

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
    ticketId?: string;
  };
}

const toolbarButtons = [
  {
    icon: 'solar:text-bold-linear',
    label: 'Bold',
    prefix: '**',
    suffix: '**',
    placeholder: 'bold text',
  },
  {
    icon: 'solar:text-italic-linear',
    label: 'Italic',
    prefix: '*',
    suffix: '*',
    placeholder: 'italic text',
  },
  {
    icon: 'solar:strikethrough-linear',
    label: 'Strikethrough',
    prefix: '~~',
    suffix: '~~',
    placeholder: 'strikethrough',
  },
  { type: 'separator' as const },
  {
    icon: 'solar:code-linear',
    label: 'Inline Code',
    prefix: '`',
    suffix: '`',
    placeholder: 'code',
  },
  {
    icon: 'solar:code-square-linear',
    label: 'Code Block',
    prefix: '```\n',
    suffix: '\n```',
    placeholder: 'code block',
  },
  {
    icon: 'solar:link-linear',
    label: 'Link',
    prefix: '[',
    suffix: '](url)',
    placeholder: 'link text',
  },
  { type: 'separator' as const },
  {
    icon: 'solar:list-linear',
    label: 'Bullet List',
    prefix: '- ',
    suffix: '',
    placeholder: 'list item',
    lineStart: true,
  },
  {
    icon: 'solar:list-1-linear',
    label: 'Numbered List',
    prefix: '1. ',
    suffix: '',
    placeholder: 'list item',
    lineStart: true,
  },
  {
    icon: 'solar:chat-square-like-linear',
    label: 'Blockquote',
    prefix: '> ',
    suffix: '',
    placeholder: 'quote',
    lineStart: true,
  },
  { type: 'separator' as const },
  {
    icon: 'solar:text-field-linear',
    label: 'Heading 1',
    prefix: '# ',
    suffix: '',
    placeholder: 'heading',
    lineStart: true,
  },
  {
    icon: 'solar:text-field-linear',
    label: 'Heading 2',
    prefix: '## ',
    suffix: '',
    placeholder: 'heading',
    lineStart: true,
  },
  {
    icon: 'solar:text-field-linear',
    label: 'Heading 3',
    prefix: '### ',
    suffix: '',
    placeholder: 'heading',
    lineStart: true,
  },
  { type: 'separator' as const },
  {
    icon: 'solar:minus-circle-linear',
    label: 'Horizontal Rule',
    prefix: '\n---\n',
    suffix: '',
    placeholder: '',
  },
];

export const MarkdownEditor = ({
  value,
  onChange,
  placeholder = 'Write markdown...',
  minHeight = '300px',
  showPreview: initialShowPreview = true,
  uploadContext,
}: MarkdownEditorProps) => {
  const [showPreview, setShowPreview] = useState(initialShowPreview);
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [uploadingCount, setUploadingCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Use a ref to always have the latest value in async callbacks
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const insertMarkdown = useCallback(
    (prefix: string, suffix: string, mdPlaceholder: string, lineStart?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);
      const textToInsert = selectedText || mdPlaceholder;

      let newValue: string;
      let newCursorPos: number;

      if (lineStart) {
        // Find the start of the current line
        const lineStartPos = value.lastIndexOf('\n', start - 1) + 1;
        const before = value.substring(0, lineStartPos);
        const after = value.substring(start === end ? start : end);
        const currentLineText = value.substring(lineStartPos, start);
        newValue = before + prefix + currentLineText + textToInsert + suffix + after;
        newCursorPos = lineStartPos + prefix.length + currentLineText.length + textToInsert.length;
      } else {
        const before = value.substring(0, start);
        const after = value.substring(end);
        newValue = before + prefix + textToInsert + suffix + after;
        newCursorPos = start + prefix.length + textToInsert.length;
      }

      onChange(newValue);

      // Restore cursor position
      requestAnimationFrame(() => {
        textarea.focus();
        if (!selectedText) {
          textarea.setSelectionRange(
            start + prefix.length,
            start + prefix.length + mdPlaceholder.length
          );
        } else {
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }
      });
    },
    [value, onChange]
  );

  /**
   * Inserts text at the current cursor position.
   * Returns the placeholder token for replacement later.
   */
  const insertAtCursor = useCallback(
    (text: string) => {
      const textarea = textareaRef.current;
      if (!textarea) {
        // Fallback: append to end
        onChange(valueRef.current + text);
        return;
      }

      const start = textarea.selectionStart;
      const before = valueRef.current.substring(0, start);
      const after = valueRef.current.substring(start);
      const newValue = before + text + after;
      onChange(newValue);
    },
    [onChange]
  );

  /**
   * Processes a single image file for upload.
   * Creates a placeholder, uploads to Cloudinary, then replaces the placeholder.
   */
  const processImageUpload = useCallback(
    (file: File) => {
      if (!uploadContext) return;

      const placeholderId = `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const placeholderToken = `![Uploading...][${placeholderId}]`;

      insertAtCursor(placeholderToken);
      setUploadingCount((c) => c + 1);

      const folder = resolveFolder('content', {
        orgId: uploadContext.orgId,
        ticketId: uploadContext.ticketId,
      });

      uploadToCloudinary({ context: 'content', folder, file })
        .then((result) => {
          // Replace the placeholder token with the real markdown image
          // Use ref to get the latest value
          onChange(valueRef.current.replace(placeholderToken, `![image](${result.secure_url})`));
        })
        .catch((err: unknown) => {
          const message = err instanceof CloudinaryError ? err.message : 'Upload failed';
          onChange(valueRef.current.replace(placeholderToken, `![upload failed — ${message}][]`));
          toast.error(`Image upload failed: ${message}`);
        })
        .finally(() => setUploadingCount((c) => c - 1));
    },
    [uploadContext, onChange, insertAtCursor]
  );

  /**
   * Paste handler: intercepts image paste events to upload inline.
   * Multiple images in a single paste are uploaded concurrently.
   */
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      if (!uploadContext) return;

      const imageItems = Array.from(e.clipboardData.items).filter((item) =>
        item.type.startsWith('image/')
      );

      if (imageItems.length === 0) return; // let normal text paste proceed

      e.preventDefault();

      for (const item of imageItems) {
        const file = item.getAsFile();
        if (!file) continue;
        processImageUpload(file);
      }
    },
    [uploadContext, processImageUpload]
  );

  /**
   * File input change handler for the toolbar upload button.
   */
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      for (let i = 0; i < files.length; i++) {
        processImageUpload(files[i]);
      }

      e.target.value = '';
    },
    [processImageUpload]
  );

  const lineNumbers = value.split('\n').length;

  return (
    <div className="border border-border bg-card overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/30 flex-wrap">
        {toolbarButtons.map((btn, i) => {
          if ('type' in btn && btn.type === 'separator') {
            return <div key={i} className="w-px h-5 bg-border mx-1" />;
          }
          const b = btn as (typeof toolbarButtons)[0] & {
            icon: string;
            prefix: string;
            suffix: string;
            placeholder: string;
            lineStart?: boolean;
          };
          return (
            <button
              key={i}
              onClick={() => insertMarkdown(b.prefix, b.suffix, b.placeholder, b.lineStart)}
              title={b.label}
              className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon icon={b.icon} className="w-4 h-4" />
            </button>
          );
        })}

        {/* Image Upload Button (only when uploadContext is provided) */}
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

        <div className="ml-auto flex gap-1">
          <button
            onClick={() => {
              setActiveTab('write');
              setShowPreview(false);
            }}
            className={cn(
              'font-mono text-[10px] px-2 py-1 border transition-colors',
              activeTab === 'write' && !showPreview
                ? 'border-primary text-primary bg-primary/10'
                : 'border-border text-muted-foreground hover:border-primary/30'
            )}
          >
            Write
          </button>
          <button
            onClick={() => {
              setShowPreview(true);
              setActiveTab('write');
            }}
            className={cn(
              'font-mono text-[10px] px-2 py-1 border transition-colors',
              showPreview
                ? 'border-primary text-primary bg-primary/10'
                : 'border-border text-muted-foreground hover:border-primary/30'
            )}
          >
            Split
          </button>
          <button
            onClick={() => {
              setActiveTab('preview');
              setShowPreview(false);
            }}
            className={cn(
              'font-mono text-[10px] px-2 py-1 border transition-colors',
              activeTab === 'preview' && !showPreview
                ? 'border-primary text-primary bg-primary/10'
                : 'border-border text-muted-foreground hover:border-primary/30'
            )}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Upload Status Bar */}
      {uploadingCount > 0 && (
        <div className="px-3 py-1.5 bg-primary/5 border-b border-primary/20 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="font-mono text-[10px] text-primary uppercase tracking-widest">
            Uploading {uploadingCount} image{uploadingCount > 1 ? 's' : ''}...
          </span>
        </div>
      )}

      {/* Editor Area */}
      <div
        className={cn('grid', showPreview ? 'grid-cols-2' : 'grid-cols-1')}
        style={{ minHeight }}
      >
        {(activeTab === 'write' || showPreview) && (
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-muted/30 flex flex-col items-center pt-3 font-mono text-[9px] text-muted-foreground select-none overflow-hidden">
              {Array.from({ length: Math.max(lineNumbers, 10) }, (_, i) => (
                <div key={i} className="h-5 leading-5">
                  {i + 1}
                </div>
              ))}
            </div>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onPaste={handlePaste}
              placeholder={placeholder}
              className="w-full h-full pl-10 p-3 bg-muted/50 text-sm font-mono text-foreground placeholder:text-muted-foreground outline-none resize-y"
              style={{ minHeight }}
            />
          </div>
        )}

        {(showPreview || activeTab === 'preview') && (
          <div
            className={cn(
              'p-4 bg-background overflow-y-auto',
              showPreview && 'border-l border-border'
            )}
            style={{ minHeight }}
          >
            {value ? (
              <MarkdownRenderer content={value} />
            ) : (
              <p className="text-muted-foreground text-sm italic">
                Live preview will appear here...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

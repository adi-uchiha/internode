'use client';

import { useState, useRef, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from './MarkdownRenderer';
import { cn } from '@/lib/utils';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  showPreview?: boolean;
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
}: MarkdownEditorProps) => {
  const [showPreview, setShowPreview] = useState(initialShowPreview);
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = useCallback(
    (prefix: string, suffix: string, placeholder: string, lineStart?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);
      const textToInsert = selectedText || placeholder;

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
            start + prefix.length + placeholder.length
          );
        } else {
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }
      });
    },
    [value, onChange]
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

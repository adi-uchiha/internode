'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CollapsibleDescriptionProps {
  content: string;
  /** Max height in pixels before collapsing. Default: 300 */
  collapsedMaxHeight?: number;
}

export const CollapsibleDescription = ({
  content,
  collapsedMaxHeight = 300,
}: CollapsibleDescriptionProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsCollapse, setNeedsCollapse] = useState(false);

  const measure = useCallback(() => {
    if (!contentRef.current) return;
    const scrollHeight = contentRef.current.scrollHeight;
    setNeedsCollapse(scrollHeight > collapsedMaxHeight + 40);
  }, [collapsedMaxHeight]);

  // Measure after initial render and whenever content changes
  useEffect(() => {
    measure();
  }, [content, measure]);

  // Re-measure on window resize (e.g. layout shifts)
  useEffect(() => {
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  return (
    <div className="relative">
      <div
        ref={contentRef}
        className={cn(
          'transition-[max-height] duration-300 ease-in-out overflow-hidden',
          !isExpanded && needsCollapse && 'max-h-(--collapsed-height)'
        )}
        style={
          {
            '--collapsed-height': `${collapsedMaxHeight}px`,
          } as React.CSSProperties
        }
      >
        <MarkdownRenderer content={content} />
      </div>

      {/* Gradient fade overlay when collapsed */}
      {needsCollapse && !isExpanded && (
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-card via-card/80 to-transparent pointer-events-none" />
      )}

      {/* Show more / Show less toggle */}
      {needsCollapse && (
        <div className={cn('flex justify-center', isExpanded ? 'mt-4' : 'relative -mt-2')}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="h-7 px-4 font-mono text-[11px] text-primary hover:text-primary hover:bg-primary/10 border border-primary/20 bg-card shadow-sm transition-all"
          >
            <Icon
              icon={isExpanded ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'}
              className="w-3.5 h-3.5 mr-1.5"
            />
            {isExpanded ? 'Show less' : 'Show more'}
          </Button>
        </div>
      )}
    </div>
  );
};

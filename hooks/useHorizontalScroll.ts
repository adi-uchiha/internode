import { useEffect, useRef, useCallback } from 'react';

/**
 * Attaches a wheel event listener to the returned ref so that:
 *   - Shift + vertical scroll → horizontal scroll (standard browser shortcut)
 *   - Plain horizontal scroll (trackpad two-finger swipe) → horizontal scroll
 *
 * The listener is registered as `{ passive: false }` so we can call
 * `preventDefault()` and stop the page from scrolling vertically when the
 * user intends to scroll the board horizontally.
 */
export function useHorizontalScroll<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  const handleWheel = useCallback((e: WheelEvent) => {
    const el = ref.current;
    if (!el) return;

    // Shift + vertical wheel → horizontal scroll.
    // On Linux, X11/browser may pre-convert Shift+scroll into deltaX before
    // the JS event fires, so handle both deltaY and deltaX when shiftKey held.
    if (e.shiftKey) {
      const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX;
      if (delta !== 0) {
        e.preventDefault();
        el.scrollLeft += delta;
      }
      return;
    }

    // Native horizontal scroll (trackpad swipe, or mouse with tilt wheel)
    if (e.deltaX !== 0) {
      // Only intercept if the element can actually scroll horizontally;
      // otherwise let the event propagate normally.
      const canScrollLeft = el.scrollLeft > 0;
      const canScrollRight = el.scrollLeft < el.scrollWidth - el.clientWidth;
      if (canScrollLeft || canScrollRight) {
        e.preventDefault();
        el.scrollLeft += e.deltaX;
      }
    }
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Must be non-passive so preventDefault() works inside the handler.
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  return ref;
}

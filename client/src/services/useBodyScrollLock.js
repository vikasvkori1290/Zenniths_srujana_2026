import { useEffect } from 'react';

/**
 * Custom hook to lock background scrolling when a modal, drawer, or bottom sheet is open.
 * Completely prevents background scroll chaining across mobile touch and desktop browsers.
 *
 * @param {boolean} isLocked - Whether background scrolling should be disabled
 */
export function useBodyScrollLock(isLocked) {
  useEffect(() => {
    if (!isLocked) return;

    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [isLocked]);
}

export default useBodyScrollLock;

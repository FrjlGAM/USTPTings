import { useEffect } from 'react';

export function usePreventScroll(isOpen: boolean) {
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position and add overflow-hidden to body
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.overflowY = 'hidden';
    } else {
      // Restore scroll position and remove overflow-hidden from body
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      document.body.style.overflowY = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
  }, [isOpen]);
} 
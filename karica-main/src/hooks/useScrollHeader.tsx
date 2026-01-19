import { useEffect, useState, useCallback } from 'react';

interface ScrollHeaderState {
  isCollapsed: boolean;
  scrollY: number;
  scrollDirection: 'up' | 'down' | null;
  isAtTop: boolean;
}

interface UseScrollHeaderOptions {
  threshold?: number;
  collapseThreshold?: number;
}

export function useScrollHeader(options: UseScrollHeaderOptions = {}): ScrollHeaderState {
  const { threshold = 10, collapseThreshold = 60 } = options;
  
  const [state, setState] = useState<ScrollHeaderState>({
    isCollapsed: false,
    scrollY: 0,
    scrollDirection: null,
    isAtTop: true,
  });

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    
    setState(prevState => {
      const scrollDirection = currentScrollY > prevState.scrollY ? 'down' : 'up';
      const isAtTop = currentScrollY < threshold;
      const isCollapsed = currentScrollY > collapseThreshold;

      // Only update if something changed
      if (
        prevState.scrollY === currentScrollY &&
        prevState.scrollDirection === scrollDirection &&
        prevState.isAtTop === isAtTop &&
        prevState.isCollapsed === isCollapsed
      ) {
        return prevState;
      }

      return {
        scrollY: currentScrollY,
        scrollDirection,
        isAtTop,
        isCollapsed,
      };
    });
  }, [threshold, collapseThreshold]);

  useEffect(() => {
    // Use passive listener for better scroll performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial check
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return state;
}

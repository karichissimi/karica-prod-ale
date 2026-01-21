import { useState, useCallback, useRef } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  resistance?: number;
  maxPull?: number;
}

interface PullToRefreshState {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
  pullProgress: number;
}

export function usePullToRefresh(options: UsePullToRefreshOptions): PullToRefreshState & {
  containerRef: React.RefObject<HTMLDivElement | null>;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
} {
  const {
    onRefresh,
    threshold = 80,
    resistance = 2.5,
    maxPull = 150
  } = options;

  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    isRefreshing: false,
    pullDistance: 0,
    pullProgress: 0,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isAtTop = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (state.isRefreshing) return;

    // Check if the scroll container is at the top
    const scrollContainer = document.querySelector('[data-scroll-container]');
    const scrollTop = scrollContainer?.scrollTop ?? 0;

    if (scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      isAtTop.current = true;
    } else {
      isAtTop.current = false;
    }
  }, [state.isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (state.isRefreshing || !isAtTop.current) return;

    // Double-check scroll position
    const scrollContainer = document.querySelector('[data-scroll-container]');
    const scrollTop = scrollContainer?.scrollTop ?? 0;

    if (scrollTop > 0) {
      if (state.isPulling) {
        setState(prev => ({ ...prev, isPulling: false, pullDistance: 0, pullProgress: 0 }));
      }
      isAtTop.current = false;
      return;
    }

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 10) {
      // Apply resistance to make pull feel natural
      const distance = Math.min(diff / resistance, maxPull);
      const progress = Math.min(distance / threshold, 1);

      setState(prev => ({
        ...prev,
        isPulling: true,
        pullDistance: distance,
        pullProgress: progress,
      }));
    } else if (diff < 0 && state.isPulling) {
      // User is scrolling up, cancel pull
      setState(prev => ({
        ...prev,
        isPulling: false,
        pullDistance: 0,
        pullProgress: 0,
      }));
    }
  }, [state.isRefreshing, state.isPulling, resistance, maxPull, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!state.isPulling) return;

    if (state.pullDistance >= threshold && !state.isRefreshing) {
      setState(prev => ({
        ...prev,
        isRefreshing: true,
        pullDistance: threshold * 0.6,
        pullProgress: 0.6
      }));

      try {
        await onRefresh();
      } finally {
        setState({
          isRefreshing: false,
          isPulling: false,
          pullDistance: 0,
          pullProgress: 0
        });
      }
    } else {
      setState({
        isPulling: false,
        isRefreshing: false,
        pullDistance: 0,
        pullProgress: 0
      });
    }

    startY.current = 0;
    isAtTop.current = false;
  }, [state.isPulling, state.pullDistance, state.isRefreshing, threshold, onRefresh]);

  return {
    ...state,
    containerRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}

// Centralized animation system for Karica
// All animation utilities, hooks, and constants

import { useEffect, useState } from 'react';

// Hook to detect reduced motion preference
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

// Animation timing constants
export const TIMING = {
  fast: 150,
  normal: 300,
  slow: 500,
  spring: 600,
} as const;

// Easing functions
export const EASING = {
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
} as const;

// Stagger delay calculator for list animations
export function getStaggerDelay(index: number, baseDelay = 50): number {
  return index * baseDelay;
}

// Animation class names for common patterns
export const animationClasses = {
  fadeIn: 'animate-fade-in',
  fadeOut: 'animate-fade-out',
  scaleIn: 'animate-scale-in',
  scaleOut: 'animate-scale-out',
  slideUp: 'animate-slide-up',
  slideDown: 'animate-slide-down',
  shimmer: 'animate-shimmer',
  shine: 'animate-shine',
  pulse: 'animate-pulse-soft',
  glow: 'animate-glow-pulse',
  float: 'animate-float',
  bounce: 'animate-bounce-soft',
  spin: 'animate-spin-slow',
  wiggle: 'animate-wiggle',
} as const;

// Transition class builder
export function buildTransition(
  properties: string[] = ['all'],
  duration = TIMING.normal,
  easing = EASING.smooth
): string {
  return properties.map(prop => `${prop} ${duration}ms ${easing}`).join(', ');
}

// Hook for staggered animations
export function useStaggeredAnimation(itemCount: number, baseDelay = 50) {
  const [visibleItems, setVisibleItems] = useState<number[]>([]);

  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];
    
    for (let i = 0; i < itemCount; i++) {
      const timeout = setTimeout(() => {
        setVisibleItems(prev => [...prev, i]);
      }, i * baseDelay);
      timeouts.push(timeout);
    }

    return () => timeouts.forEach(clearTimeout);
  }, [itemCount, baseDelay]);

  return visibleItems;
}

// Hook for intersection observer based animations
export function useInViewAnimation(threshold = 0.1) {
  const [ref, setRef] = useState<HTMLElement | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, threshold]);

  return { ref: setRef, isInView };
}

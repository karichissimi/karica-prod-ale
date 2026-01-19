"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function useScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // Scroll to top when route changes
    window.scrollTo({ top: 0, behavior: "instant" });

    // Also scroll any scrollable containers
    const scrollableContainers = document.querySelectorAll('[data-scroll-container]');
    scrollableContainers.forEach(container => {
      container.scrollTo({ top: 0, behavior: "instant" });
    });
  }, [pathname]);
}

export function ScrollToTop() {
  useScrollToTop();
  return null;
}

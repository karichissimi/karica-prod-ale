"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = React.useState(true);
  const [displayChildren, setDisplayChildren] = React.useState(children);
  const [currentKey, setCurrentKey] = React.useState(pathname);

  React.useEffect(() => {
    if (pathname !== currentKey) {
      // Start exit animation
      setIsVisible(false);

      // After exit animation, update content and start enter animation
      const timeout = setTimeout(() => {
        setDisplayChildren(children);
        setCurrentKey(pathname);
        setIsVisible(true);
      }, 150); // Match animation duration

      return () => clearTimeout(timeout);
    } else {
      setDisplayChildren(children);
    }
  }, [pathname, children, currentKey]);

  return (
    <div
      className={cn(
        "transition-all duration-150 ease-out will-change-[transform,opacity]",
        "transform-gpu backface-hidden",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-2",
        className
      )}
    >
      {displayChildren}
    </div>
  );
}

import * as React from "react";
import { cn } from "@/lib/utils";
import AnimatedLogo from "@/components/AnimatedLogo";

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  showProgress?: boolean;
  progress?: number;
  className?: string;
}

export function LoadingOverlay({
  isLoading,
  message = "Caricamento...",
  showProgress = false,
  progress = 0,
  className,
}: LoadingOverlayProps) {
  const [isVisible, setIsVisible] = React.useState(isLoading);

  React.useEffect(() => {
    if (isLoading) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/80 backdrop-blur-md transition-opacity duration-300",
        isLoading ? "opacity-100" : "opacity-0",
        className
      )}
    >
      {/* Animated background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-secondary/10 rounded-full blur-2xl animate-pulse-soft" style={{ animationDelay: "500ms" }} />
      </div>

      {/* Animated Logo */}
      <div className="relative mb-6">
        <AnimatedLogo className="h-20 w-20" />
        
        {/* Orbiting dots */}
        <div className="absolute inset-0 animate-spin-slow" style={{ animationDuration: "3s" }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full" />
        </div>
        <div className="absolute inset-0 animate-spin-slow" style={{ animationDuration: "4s", animationDirection: "reverse" }}>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-secondary rounded-full" />
        </div>
      </div>

      {/* Message */}
      <p className="text-sm text-muted-foreground animate-pulse-soft">{message}</p>

      {/* Progress bar */}
      {showProgress && (
        <div className="w-48 mt-4">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-primary rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">{progress}%</p>
        </div>
      )}
    </div>
  );
}

// Global progress bar (top of page)
interface GlobalProgressProps {
  isLoading: boolean;
  progress?: number;
  className?: string;
}

export function GlobalProgress({ isLoading, progress, className }: GlobalProgressProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [internalProgress, setInternalProgress] = React.useState(0);

  React.useEffect(() => {
    if (isLoading) {
      setIsVisible(true);
      setInternalProgress(0);
      
      // Simulate progress if no explicit progress is provided
      if (progress === undefined) {
        const interval = setInterval(() => {
          setInternalProgress(prev => {
            if (prev >= 90) return prev;
            return prev + Math.random() * 10;
          });
        }, 500);
        return () => clearInterval(interval);
      }
    } else {
      setInternalProgress(100);
      const timer = setTimeout(() => setIsVisible(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, progress]);

  React.useEffect(() => {
    if (progress !== undefined) {
      setInternalProgress(progress);
    }
  }, [progress]);

  if (!isVisible) return null;

  return (
    <div 
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] h-1 bg-muted/50 overflow-hidden",
        className
      )}
    >
      <div
        className={cn(
          "h-full bg-gradient-primary transition-all duration-300 ease-out",
          !isLoading && "opacity-0"
        )}
        style={{ width: `${internalProgress}%` }}
      />
      
      {/* Shimmer effect */}
      {isLoading && (
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      )}
    </div>
  );
}

// Simple inline spinner
interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-3",
  };

  return (
    <div
      className={cn(
        "rounded-full border-primary/30 border-t-primary animate-spin",
        sizeClasses[size],
        className
      )}
    />
  );
}

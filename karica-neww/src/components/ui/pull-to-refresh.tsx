import * as React from "react";
import { cn } from "@/lib/utils";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import karicaLogo from "@/assets/karica-logo-2a.png";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
}

export function PullToRefresh({ children, onRefresh, className }: PullToRefreshProps) {
  const { 
    isPulling, 
    isRefreshing, 
    pullDistance, 
    pullProgress, 
    containerRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd 
  } = usePullToRefresh({
    onRefresh,
    threshold: 80,
  });

  return (
    <div 
      ref={containerRef} 
      className={cn("relative touch-pan-y", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div 
        className={cn(
          "absolute left-0 right-0 flex items-center justify-center overflow-hidden transition-all duration-200 z-50 pointer-events-none",
          isPulling || isRefreshing ? "opacity-100" : "opacity-0"
        )}
        style={{
          height: pullDistance,
          top: 0,
        }}
      >
        <div 
          className={cn(
            "relative flex items-center justify-center",
            isRefreshing && "animate-bounce-soft"
          )}
          style={{
            transform: `scale(${0.5 + pullProgress * 0.5}) rotate(${pullProgress * 360}deg)`,
            opacity: Math.min(pullProgress * 1.5, 1),
          }}
        >
          {/* Glow effect */}
          <div 
            className={cn(
              "absolute inset-0 rounded-full blur-md transition-opacity duration-300",
              isRefreshing ? "bg-primary/40 animate-pulse-soft" : "bg-primary/20"
            )}
            style={{
              transform: 'scale(1.5)',
              opacity: pullProgress,
            }}
          />
          
          {/* Logo */}
          <img
            src={karicaLogo}
            alt=""
            className={cn(
              "relative h-10 w-10 object-contain transition-all duration-200",
              isRefreshing && "animate-spin-slow"
            )}
          />
          
          {/* Progress ring */}
          {!isRefreshing && pullProgress > 0 && (
            <svg
              className="absolute inset-0 -rotate-90"
              viewBox="0 0 40 40"
              style={{ width: 40, height: 40 }}
            >
              <circle
                cx="20"
                cy="20"
                r="18"
                fill="none"
                stroke="hsl(var(--primary) / 0.2)"
                strokeWidth="2"
              />
              <circle
                cx="20"
                cy="20"
                r="18"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={`${pullProgress * 113} 113`}
                className="transition-all duration-100"
              />
            </svg>
          )}
        </div>
        
        {/* "Release to refresh" text */}
        {pullProgress >= 1 && !isRefreshing && (
          <span className="absolute bottom-2 text-xs text-primary font-medium animate-fade-in">
            Rilascia per aggiornare
          </span>
        )}
        
        {/* "Refreshing" text */}
        {isRefreshing && (
          <span className="absolute bottom-2 text-xs text-primary font-medium animate-pulse">
            Aggiornamento...
          </span>
        )}
      </div>
      
      {/* Content with transform */}
      <div 
        className="transition-transform duration-200 ease-out"
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}

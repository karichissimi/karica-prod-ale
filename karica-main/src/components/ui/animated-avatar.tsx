import * as React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AnimatedAvatarProps {
  src?: string;
  fallback: string;
  size?: "sm" | "md" | "lg" | "xl";
  showRing?: boolean;
  ringColor?: "primary" | "secondary" | "gradient";
  badge?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
  xl: "h-24 w-24",
};

const ringPadding = {
  sm: "p-0.5",
  md: "p-0.5",
  lg: "p-1",
  xl: "p-1",
};

const fallbackTextSize = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-lg",
  xl: "text-2xl",
};

export function AnimatedAvatar({
  src,
  fallback,
  size = "md",
  showRing = true,
  ringColor = "gradient",
  badge,
  onClick,
  className,
}: AnimatedAvatarProps) {
  return (
    <div 
      className={cn(
        "relative inline-block group cursor-pointer",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {/* Animated gradient ring */}
      {showRing && (
        <div 
          className={cn(
            "absolute -inset-1 rounded-full opacity-70 group-hover:opacity-100 transition-all duration-300",
            ringColor === "gradient" && "bg-gradient-primary animate-spin-slow",
            ringColor === "primary" && "bg-primary",
            ringColor === "secondary" && "bg-secondary",
          )}
          style={{
            animationDuration: ringColor === "gradient" ? "8s" : undefined,
          }}
        />
      )}
      
      {/* Ring glow effect on hover */}
      {showRing && (
        <div 
          className={cn(
            "absolute -inset-2 rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-300 blur-md",
            ringColor === "gradient" && "bg-gradient-primary",
            ringColor === "primary" && "bg-primary",
            ringColor === "secondary" && "bg-secondary",
          )}
        />
      )}
      
      {/* Avatar container with background to hide ring */}
      <div className={cn(
        "relative rounded-full bg-background",
        ringPadding[size]
      )}>
        <Avatar className={cn(
          sizeClasses[size],
          "transition-transform duration-300 group-hover:scale-105 border-2 border-background"
        )}>
          {src && <AvatarImage src={src} alt="Avatar" />}
          <AvatarFallback className={cn(
            "bg-gradient-primary text-primary-foreground font-semibold",
            fallbackTextSize[size]
          )}>
            {fallback}
          </AvatarFallback>
        </Avatar>
      </div>
      
      {/* Badge */}
      {badge && (
        <div className="absolute -bottom-1 -right-1 z-10">
          {badge}
        </div>
      )}
    </div>
  );
}

// Level badge to use with AnimatedAvatar
interface LevelBadgeProps {
  level: number;
  className?: string;
}

export function LevelBadge({ level, className }: LevelBadgeProps) {
  return (
    <div 
      className={cn(
        "flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-lg",
        "animate-scale-in",
        className
      )}
    >
      {level}
    </div>
  );
}

// Achievement count badge
interface AchievementBadgeProps {
  count: number;
  className?: string;
}

export function AchievementBadge({ count, className }: AchievementBadgeProps) {
  return (
    <div 
      className={cn(
        "flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-bold shadow-lg",
        className
      )}
    >
      🏆 {count}
    </div>
  );
}

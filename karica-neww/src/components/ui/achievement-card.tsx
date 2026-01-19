import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface AchievementCardProps {
  icon: string;
  title: string;
  description: string;
  earned: boolean;
  onClick?: () => void;
  className?: string;
}

export function AchievementCard({
  icon,
  title,
  description,
  earned,
  onClick,
  className,
}: AchievementCardProps) {
  return (
    <div
      onClick={earned ? onClick : undefined}
      className={cn(
        "relative p-4 rounded-xl border text-center transition-all duration-300 overflow-hidden group",
        earned
          ? "bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20 cursor-pointer hover:scale-105 hover:shadow-lg hover:border-primary/40"
          : "opacity-40 cursor-not-allowed bg-muted/20",
        className
      )}
    >
      {/* Shine effect overlay */}
      {earned && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div 
            className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            }}
          />
        </div>
      )}
      
      {/* Icon with glow */}
      <div className="relative mb-2">
        <span className={cn(
          "text-4xl block transition-transform duration-300",
          earned && "group-hover:scale-110 group-hover:animate-bounce-soft"
        )}>
          {icon}
        </span>
        {earned && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-primary/20 blur-lg animate-pulse-soft" />
          </div>
        )}
      </div>
      
      {/* Title */}
      <p className={cn(
        "font-semibold text-sm mb-1",
        earned && "text-foreground"
      )}>
        {title}
      </p>
      
      {/* Description */}
      <p className="text-xs text-muted-foreground line-clamp-2">
        {description}
      </p>
      
      {/* Earned badge */}
      {earned && (
        <Badge 
          variant="outline" 
          className="mt-2 text-[10px] border-primary/30 text-primary bg-primary/5"
        >
          ✓ Sbloccato
        </Badge>
      )}
      
      {/* Locked overlay */}
      {!earned && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px] rounded-xl">
          <span className="text-2xl">🔒</span>
        </div>
      )}
    </div>
  );
}

// Grid container for achievements
interface AchievementGridProps {
  children: React.ReactNode;
  className?: string;
}

export function AchievementGrid({ children, className }: AchievementGridProps) {
  return (
    <div className={cn(
      "grid grid-cols-2 sm:grid-cols-3 gap-3",
      className
    )}>
      {children}
    </div>
  );
}

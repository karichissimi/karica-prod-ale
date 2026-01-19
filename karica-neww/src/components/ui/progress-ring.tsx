import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  trackClassName?: string;
  progressClassName?: string;
  showValue?: boolean;
  valueClassName?: string;
  animate?: boolean;
  glow?: boolean;
  children?: React.ReactNode;
}

export function ProgressRing({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  className,
  trackClassName,
  progressClassName,
  showValue = true,
  valueClassName,
  animate = true,
  glow = true,
  children,
}: ProgressRingProps) {
  const [animatedValue, setAnimatedValue] = React.useState(0);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min((animatedValue / max) * 100, 100);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  // Animate value on mount and when value changes
  React.useEffect(() => {
    if (animate) {
      const duration = 1000;
      const startTime = Date.now();
      const startValue = animatedValue;
      const endValue = value;
      
      const animateValue = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out cubic)
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const currentValue = startValue + (endValue - startValue) * easeOutCubic;
        
        setAnimatedValue(currentValue);
        
        if (progress < 1) {
          requestAnimationFrame(animateValue);
        }
      };
      
      requestAnimationFrame(animateValue);
    } else {
      setAnimatedValue(value);
    }
  }, [value, animate]);

  return (
    <div 
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      {/* Glow effect */}
      {glow && percentage > 0 && (
        <div 
          className="absolute inset-0 rounded-full opacity-30 blur-md"
          style={{
            background: `conic-gradient(from 0deg, hsl(var(--primary)) ${percentage}%, transparent ${percentage}%)`,
          }}
        />
      )}
      
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className={cn("text-muted/30", trackClassName)}
        />
        
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn(
            "transition-all duration-1000 ease-out",
            progressClassName
          )}
        />
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--secondary))" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Center content */}
      <div className={cn(
        "absolute inset-0 flex flex-col items-center justify-center",
        valueClassName
      )}>
        {children || (showValue && (
          <span className="text-2xl font-bold">
            {Math.round(percentage)}%
          </span>
        ))}
      </div>
    </div>
  );
}

// Smaller variant for inline use
export function ProgressRingSmall({
  value,
  max = 100,
  size = 40,
  strokeWidth = 4,
  className,
  ...props
}: Omit<ProgressRingProps, 'showValue' | 'children'>) {
  return (
    <ProgressRing
      value={value}
      max={max}
      size={size}
      strokeWidth={strokeWidth}
      showValue={false}
      glow={false}
      className={className}
      {...props}
    />
  );
}

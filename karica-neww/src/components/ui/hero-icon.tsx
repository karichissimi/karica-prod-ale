import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeroIconProps {
    icon: LucideIcon;
    className?: string; // Container class
    iconClassName?: string; // Icon SVG class
    color?: string; // Main color hex
}

export function HeroIcon({ icon: Icon, className, iconClassName, color = "#0C86C7" }: HeroIconProps) {
    return (
        <div className={cn("relative flex items-center justify-center w-12 h-12", className)}>
            {/* Background Glow Layer */}
            <div
                className="absolute inset-0 rounded-xl opacity-20 blur-md"
                style={{ backgroundColor: color }}
            />

            {/* Glassy Container */}
            <div className="absolute inset-0 bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg" />

            {/* 3D Icon Layer - Shadow */}
            <Icon
                className={cn("absolute w-6 h-6 text-black/20 translate-y-0.5 translate-x-0.5 transform", iconClassName)}
                strokeWidth={3}
            />

            {/* 3D Icon Layer - Main */}
            <Icon
                className={cn("relative z-10 w-6 h-6 drop-shadow-md", iconClassName)}
                style={{ color: color }}
                strokeWidth={2.5}
            />
        </div>
    );
}

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface BentoCardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    title?: string;
    subtitle?: string;
    icon?: ReactNode;
    renderVisual?: () => ReactNode;
    featured?: boolean;
}

export function BentoGrid({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-4 gap-4 max-w-7xl mx-auto", className)}>
            {children}
        </div>
    );
}

export function BentoCard({
    children,
    className,
    onClick,
    title,
    subtitle,
    icon,
    renderVisual,
    featured = false,
}: BentoCardProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative flex flex-col justify-between overflow-hidden rounded-xl",
                "bg-white dark:bg-[#203149] border border-black/5 dark:border-white/10", // Strict palette: Dark Blue background in dark mode
                "shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1",
                onClick && "cursor-pointer",
                featured ? "md:col-span-2 md:row-span-2" : "md:col-span-1",
                className
            )}
        >
            {/* Background Gradient Effect - strict brand colors */}
            <div
                className={cn(
                    "absolute inset-0 z-0 transition-opacity duration-500 opacity-0 group-hover:opacity-100",
                    "bg-gradient-to-br from-[#45FF4A]/10 via-transparent to-[#0C86C7]/10" // Green to Blue gradient
                )}
            />

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full p-6">
                {/* Header */}
                {(title || icon) && (
                    <div className="flex items-center gap-3 mb-4">
                        {icon && (
                            <div className="p-2 rounded-lg bg-[#45FF4A]/10 text-[#203149] dark:text-[#45FF4A]">
                                {icon}
                            </div>
                        )}
                        <div>
                            {title && <h3 className="font-semibold text-[#203149] dark:text-white">{title}</h3>}
                            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className="flex-1">
                    {children}
                </div>
            </div>

            {renderVisual && (
                <div className="absolute right-0 bottom-0 opacity-10 group-hover:scale-110 transition-transform duration-500 group-hover:opacity-20 pointer-events-none">
                    {renderVisual()}
                </div>
            )}
        </div>
    );
}

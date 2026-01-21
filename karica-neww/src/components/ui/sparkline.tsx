import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface SparklineProps {
    data: number[];
    width?: number;
    height?: number;
    color?: string;
    className?: string;
    fill?: boolean;
}

export function Sparkline({
    data,
    width = 100,
    height = 40,
    color = "#45FF4A", // Brand Green
    className,
    fill = true,
}: SparklineProps) {
    const { points, areaPath } = useMemo(() => {
        if (!data || data.length < 2) return { points: "", areaPath: "" };

        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;
        const stepX = width / (data.length - 1);

        const coordinates = data.map((d, i) => {
            const x = i * stepX;
            // Invert Y axis because SVG origin is top-left
            const normalizedY = (d - min) / range;
            const y = height - normalizedY * height;
            return { x, y };
        });

        const pointsStr = coordinates.map((p) => `${p.x},${p.y}`).join(" ");

        let areaPathStr = "";
        if (fill) {
            areaPathStr = `M ${coordinates[0].x},${height} L ${pointsStr} L ${coordinates[coordinates.length - 1].x},${height} Z`;
        }

        return { points: pointsStr, areaPath: areaPathStr };
    }, [data, width, height, fill]);

    if (!data || data.length < 2) return null;

    return (
        <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            className={cn("overflow-visible", className)}
        >
            {/* Defs for gradients */}
            <defs>
                <linearGradient id="sparkline-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>

            {fill && <path d={areaPath} fill="url(#sparkline-fill)" className="transition-all duration-300" />}

            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-300"
            />
        </svg>
    );
}

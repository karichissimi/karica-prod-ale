import * as React from "react";
import { cn } from "@/lib/utils";
import karicaLogo from "@/assets/karica-logo-2a.png";

interface CardWithWatermarkProps extends React.HTMLAttributes<HTMLDivElement> {
  watermarkPosition?: "top-right" | "bottom-right" | "center";
  watermarkOpacity?: number;
  watermarkSize?: "sm" | "md" | "lg";
}

const CardWithWatermark = React.forwardRef<HTMLDivElement, CardWithWatermarkProps>(
  ({ className, children, watermarkPosition = "bottom-right", watermarkOpacity = 0.06, watermarkSize = "md", ...props }, ref) => {
    const positionClasses = {
      "top-right": "top-2 right-2",
      "bottom-right": "bottom-2 right-2",
      "center": "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
    };

    const sizeClasses = {
      sm: "h-12 w-12",
      md: "h-20 w-20",
      lg: "h-32 w-32",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm",
          className
        )}
        {...props}
      >
        {/* Watermark */}
        <img
          src={karicaLogo.src}
          alt=""
          aria-hidden="true"
          className={cn(
            "absolute pointer-events-none select-none object-contain",
            positionClasses[watermarkPosition],
            sizeClasses[watermarkSize]
          )}
          style={{ opacity: watermarkOpacity }}
        />
        {/* Content */}
        <div className="relative z-10">{children}</div>
      </div>
    );
  }
);

CardWithWatermark.displayName = "CardWithWatermark";

export { CardWithWatermark };
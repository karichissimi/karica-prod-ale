import * as React from "react";
import { cn } from "@/lib/utils";

interface RippleProps {
  x: number;
  y: number;
  size: number;
}

export function Ripple({ x, y, size }: RippleProps) {
  return (
    <span
      className="absolute rounded-full bg-foreground/20 animate-ripple pointer-events-none transform-gpu"
      style={{
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
      }}
    />
  );
}

interface RippleContainerProps {
  ripples: Array<{ id: number; x: number; y: number; size: number }>;
}

export function RippleContainer({ ripples }: RippleContainerProps) {
  if (ripples.length === 0) return null;
  
  return (
    <span className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none">
      {ripples.map((ripple) => (
        <Ripple key={ripple.id} x={ripple.x} y={ripple.y} size={ripple.size} />
      ))}
    </span>
  );
}

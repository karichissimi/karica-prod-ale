"use client";

import confetti from "canvas-confetti";
import { useEffect } from "react";

interface ConfettiProps {
    trigger: boolean;
    onComplete?: () => void;
}

export const ConfettiExplosion = ({ trigger, onComplete }: ConfettiProps) => {
    useEffect(() => {
        if (trigger) {
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 999 };

            const randomInRange = (min: number, max: number) => {
                return Math.random() * (max - min) + min;
            }

            const interval: any = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    clearInterval(interval);
                    if (onComplete) onComplete();
                    return;
                }

                const particleCount = 50 * (timeLeft / duration);

                // Use brand colors
                const simpleColors = ['#45FF4A', '#0C86C7', '#203149'];

                confetti({
                    ...defaults,
                    particleCount,
                    colors: simpleColors,
                    origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
                });
                confetti({
                    ...defaults,
                    particleCount,
                    colors: simpleColors,
                    origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
                });
            }, 250);
        }
    }, [trigger, onComplete]);

    return null; // This component doesn't render DOM elements, just side effects
};

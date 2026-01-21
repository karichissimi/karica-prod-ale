"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

interface NumberTickerProps {
    value: number;
    direction?: "up" | "down";
    delay?: number;
    className?: string; // Allow styling
    decimalPlaces?: number;
    currency?: boolean; // Formatting helper
}

export function NumberTicker({
    value,
    direction = "up",
    delay = 0,
    className,
    decimalPlaces = 0,
    currency = false
}: NumberTickerProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const motionValue = useMotionValue(direction === "down" ? value : 0);
    const springValue = useSpring(motionValue, {
        damping: 60,
        stiffness: 100,
    });
    const isInView = useInView(ref, { once: true, margin: "0px" });

    useEffect(() => {
        if (isInView) {
            setTimeout(() => {
                motionValue.set(direction === "down" ? 0 : value);
            }, delay * 1000);
        }
    }, [motionValue, isInView, delay, value, direction]);

    useEffect(() => {
        springValue.on("change", (latest) => {
            if (ref.current) {
                let formatted = latest.toFixed(decimalPlaces);
                if (currency) {
                    formatted = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(latest);
                }
                ref.current.textContent = formatted;
            }
        });
    }, [springValue, decimalPlaces, currency]);

    return <span className={className} ref={ref} />;
}

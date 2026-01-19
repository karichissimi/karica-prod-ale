import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
    prefix: "",
    theme: {
        container: {
            center: true,
            padding: "1rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                    glow: "hsl(var(--primary-glow))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                sidebar: {
                    DEFAULT: "hsl(var(--sidebar-background))",
                    foreground: "hsl(var(--sidebar-foreground))",
                    primary: "hsl(var(--sidebar-primary))",
                    "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
                    accent: "hsl(var(--sidebar-accent))",
                    "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
                    border: "hsl(var(--sidebar-border))",
                    ring: "hsl(var(--sidebar-ring))",
                },
            },
            backgroundImage: {
                'gradient-primary': 'var(--gradient-primary)',
                'gradient-card': 'var(--gradient-card)',
            },
            boxShadow: {
                'elegant': 'var(--shadow-elegant)',
                'soft': 'var(--shadow-soft)',
            },
            transitionProperty: {
                'smooth': 'var(--transition-smooth)',
                'spring': 'var(--transition-spring)',
            },
            fontFamily: {
                'sans': ['ITC Avant Garde Gothic Pro', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
                "fade-in": {
                    "0%": { opacity: "0", transform: "translateY(10px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                "fade-out": {
                    "0%": { opacity: "1", transform: "translateY(0)" },
                    "100%": { opacity: "0", transform: "translateY(10px)" },
                },
                "scale-in": {
                    "0%": { opacity: "0", transform: "scale(0.95)" },
                    "100%": { opacity: "1", transform: "scale(1)" },
                },
                "scale-out": {
                    "0%": { opacity: "1", transform: "scale(1)" },
                    "100%": { opacity: "0", transform: "scale(0.95)" },
                },
                "slide-up": {
                    "0%": { opacity: "0", transform: "translateY(20px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                "slide-down": {
                    "0%": { opacity: "0", transform: "translateY(-20px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                "slide-in-right": {
                    "0%": { transform: "translateX(100%)" },
                    "100%": { transform: "translateX(0)" },
                },
                "slide-in-left": {
                    "0%": { transform: "translateX(-100%)" },
                    "100%": { transform: "translateX(0)" },
                },
                "shimmer": {
                    "0%": { backgroundPosition: "-200% 0" },
                    "100%": { backgroundPosition: "200% 0" },
                },
                "shine": {
                    "0%": { left: "-100%", opacity: "0" },
                    "50%": { opacity: "0.5" },
                    "100%": { left: "100%", opacity: "0" },
                },
                "glow-pulse": {
                    "0%, 100%": { boxShadow: "0 0 5px hsl(var(--primary) / 0.3), 0 0 10px hsl(var(--primary) / 0.2)" },
                    "50%": { boxShadow: "0 0 20px hsl(var(--primary) / 0.5), 0 0 40px hsl(var(--primary) / 0.3)" },
                },
                "float": {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-5px)" },
                },
                "bounce-soft": {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-3px)" },
                },
                "pulse-soft": {
                    "0%, 100%": { opacity: "1" },
                    "50%": { opacity: "0.7" },
                },
                "wiggle": {
                    "0%, 100%": { transform: "rotate(0deg)" },
                    "25%": { transform: "rotate(-3deg)" },
                    "75%": { transform: "rotate(3deg)" },
                },
                "spin-slow": {
                    "0%": { transform: "rotate(0deg)" },
                    "100%": { transform: "rotate(360deg)" },
                },
                "progress-fill": {
                    "0%": { width: "0%" },
                    "100%": { width: "var(--progress-width, 100%)" },
                },
                "indicator-slide": {
                    "0%": { transform: "translateX(var(--from-x, 0))" },
                    "100%": { transform: "translateX(var(--to-x, 0))" },
                },
                "ripple": {
                    "0%": { transform: "scale(0)", opacity: "0.5" },
                    "100%": { transform: "scale(4)", opacity: "0" },
                },
                "confetti": {
                    "0%": { transform: "translateY(0) rotate(0deg)", opacity: "1" },
                    "100%": { transform: "translateY(100vh) rotate(720deg)", opacity: "0" },
                },
                "celebrate": {
                    "0%": { transform: "scale(1)" },
                    "10%": { transform: "scale(1.1)" },
                    "20%": { transform: "scale(1)" },
                    "100%": { transform: "scale(1)" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "fade-in": "fade-in 0.4s ease-out forwards",
                "fade-out": "fade-out 0.3s ease-out forwards",
                "scale-in": "scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
                "scale-out": "scale-out 0.2s ease-out forwards",
                "slide-up": "slide-up 0.4s ease-out forwards",
                "slide-down": "slide-down 0.4s ease-out forwards",
                "slide-in-right": "slide-in-right 0.3s ease-out",
                "slide-in-left": "slide-in-left 0.3s ease-out",
                "shimmer": "shimmer 2s linear infinite",
                "shine": "shine 2s ease-in-out infinite",
                "glow-pulse": "glow-pulse 2s ease-in-out infinite",
                "float": "float 3s ease-in-out infinite",
                "bounce-soft": "bounce-soft 1s ease-in-out infinite",
                "pulse-soft": "pulse-soft 2s ease-in-out infinite",
                "wiggle": "wiggle 0.5s ease-in-out",
                "spin-slow": "spin-slow 8s linear infinite",
                "progress-fill": "progress-fill 1s ease-out forwards",
                "indicator-slide": "indicator-slide 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                "ripple": "ripple 0.6s ease-out forwards",
                "confetti": "confetti 3s ease-out forwards",
                "celebrate": "celebrate 0.8s ease-out",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
} satisfies Config;

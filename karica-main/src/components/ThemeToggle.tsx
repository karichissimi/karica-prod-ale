import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
    
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  const toggleTheme = () => {
    setIsAnimating(true);
    const newTheme = theme === "dark" ? "light" : "dark";
    
    // Add transition class to body for smooth color transitions
    document.documentElement.style.transition = "background-color 0.5s ease, color 0.5s ease";
    
    setTimeout(() => {
      setTheme(newTheme);
      localStorage.setItem("theme", newTheme);
      document.documentElement.classList.toggle("dark", newTheme === "dark");
    }, 150);
    
    setTimeout(() => {
      setIsAnimating(false);
      document.documentElement.style.transition = "";
    }, 500);
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        "rounded-full transition-all duration-300 hover:scale-110 h-8 w-8 overflow-hidden relative",
        "hover:bg-primary/10 hover:border-primary/50",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      )}
      aria-label={theme === "dark" ? "Attiva modalità chiara" : "Attiva modalità scura"}
    >
      {/* Sun icon */}
      <Sun 
        className={cn(
          "h-4 w-4 absolute transition-all duration-500",
          theme === "dark" 
            ? "rotate-0 scale-100 text-secondary" 
            : "rotate-90 scale-0 text-secondary",
          isAnimating && theme === "light" && "animate-spin-slow"
        )}
      />
      
      {/* Moon icon */}
      <Moon 
        className={cn(
          "h-4 w-4 absolute transition-all duration-500",
          theme === "light" 
            ? "rotate-0 scale-100 text-primary" 
            : "-rotate-90 scale-0 text-primary",
          isAnimating && theme === "dark" && "animate-wiggle"
        )}
      />
      
      {/* Glow effect on toggle */}
      <div 
        className={cn(
          "absolute inset-0 rounded-full transition-opacity duration-300",
          isAnimating 
            ? "opacity-100" 
            : "opacity-0",
          theme === "dark" 
            ? "bg-secondary/20" 
            : "bg-primary/20"
        )}
      />
    </Button>
  );
}

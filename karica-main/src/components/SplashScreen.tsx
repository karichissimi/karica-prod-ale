import { useEffect, useState } from 'react';
import AnimatedLogo from '@/components/AnimatedLogo';
import { cn } from '@/lib/utils';

interface SplashScreenProps {
  onComplete: () => void;
}

// Typewriter effect hook
function useTypewriter(text: string, delay: number = 100, startDelay: number = 0) {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const startTyping = () => {
      let index = 0;
      
      const type = () => {
        if (index <= text.length) {
          setDisplayText(text.slice(0, index));
          index++;
          timeout = setTimeout(type, delay);
        } else {
          setIsComplete(true);
        }
      };
      
      type();
    };

    const startTimeout = setTimeout(startTyping, startDelay);
    
    return () => {
      clearTimeout(startTimeout);
      clearTimeout(timeout);
    };
  }, [text, delay, startDelay]);

  return { displayText, isComplete };
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<'logo' | 'text' | 'fadeout'>('logo');
  const { displayText: tagline } = useTypewriter('Energia Intelligente', 80, 1000);

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase('text'), 500);
    const timer2 = setTimeout(() => setPhase('fadeout'), 2200);
    const timer3 = setTimeout(onComplete, 2800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-all duration-700",
        phase === 'fadeout' ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
      )}
    >
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary glow */}
        <div 
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-3xl transition-all duration-1000",
            phase === 'logo' ? 'bg-primary/5 scale-50' : 'bg-primary/20 scale-100'
          )}
        />
        
        {/* Secondary glow */}
        <div 
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-2xl transition-all duration-1000 delay-200",
            phase === 'logo' ? 'bg-secondary/5 scale-50' : 'bg-secondary/20 scale-100'
          )}
        />
        
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/40 rounded-full animate-float"
            style={{
              left: `${20 + i * 12}%`,
              top: `${30 + (i % 3) * 20}%`,
              animationDelay: `${i * 300}ms`,
              animationDuration: `${3 + i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Logo container */}
      <div 
        className={cn(
          "relative transition-all duration-700 ease-out",
          phase === 'logo' ? 'scale-0 opacity-0 rotate-180' : 'scale-100 opacity-100 rotate-0'
        )}
      >
        {/* Logo glow ring */}
        <div 
          className={cn(
            "absolute -inset-4 rounded-full bg-gradient-primary opacity-0 blur-xl transition-opacity duration-1000",
            phase !== 'logo' && 'opacity-30 animate-pulse-soft'
          )}
        />
        
        <AnimatedLogo className="h-28 w-28 relative z-10" />
      </div>

      {/* Brand text */}
      <div 
        className={cn(
          "mt-8 text-center transition-all duration-500",
          phase === 'text' || phase === 'fadeout' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )}
      >
        <h1 className="text-4xl font-bold font-brand">
          <span className="bg-gradient-primary bg-clip-text text-transparent">
            Karica
          </span>
        </h1>
        
        {/* Typewriter tagline */}
        <p className="text-sm text-muted-foreground mt-2 h-5">
          {tagline}
          <span className={cn(
            "inline-block w-0.5 h-4 ml-0.5 bg-primary align-middle",
            tagline.length === 'Energia Intelligente'.length ? 'animate-pulse' : 'animate-pulse'
          )} />
        </p>
      </div>

      {/* Animated loading indicator */}
      <div className={cn(
        "absolute bottom-20 transition-all duration-500",
        phase === 'text' || phase === 'fadeout' ? 'opacity-100' : 'opacity-0'
      )}>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-gradient-primary animate-bounce-soft"
              style={{ 
                animationDelay: `${i * 150}ms`,
                animationDuration: '0.8s'
              }}
            />
          ))}
        </div>
      </div>

      {/* Progress line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/30 overflow-hidden">
        <div 
          className={cn(
            "h-full bg-gradient-primary transition-all duration-[2000ms] ease-out",
            phase === 'logo' ? 'w-0' : phase === 'text' ? 'w-3/4' : 'w-full'
          )}
        />
      </div>
    </div>
  );
}

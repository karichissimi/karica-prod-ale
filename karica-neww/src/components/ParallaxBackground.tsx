import { useEffect, useState } from 'react';
import karicaLogo from '@/assets/karica-logo-2a.png';

export function ParallaxBackground() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />

      {/* Floating orbs with parallax */}
      <div
        className="absolute w-96 h-96 rounded-full bg-primary/10 blur-3xl"
        style={{
          top: '10%',
          right: '-10%',
          transform: `translateY(${scrollY * 0.3}px)`,
        }}
      />
      <div
        className="absolute w-72 h-72 rounded-full bg-secondary/10 blur-3xl"
        style={{
          bottom: '20%',
          left: '-5%',
          transform: `translateY(${scrollY * -0.2}px)`,
        }}
      />
      <div
        className="absolute w-64 h-64 rounded-full bg-accent/10 blur-2xl"
        style={{
          top: '50%',
          right: '20%',
          transform: `translateY(${scrollY * 0.15}px)`,
        }}
      />

      {/* Floating logo watermarks with parallax */}
      <img
        src={karicaLogo.src}
        alt=""
        aria-hidden="true"
        className="absolute opacity-[0.03] w-40 h-40"
        style={{
          top: '15%',
          left: '5%',
          transform: `translateY(${scrollY * 0.4}px) rotate(${scrollY * 0.02}deg)`,
        }}
      />
      <img
        src={karicaLogo.src}
        alt=""
        aria-hidden="true"
        className="absolute opacity-[0.02] w-32 h-32"
        style={{
          bottom: '30%',
          right: '10%',
          transform: `translateY(${scrollY * -0.25}px) rotate(${-scrollY * 0.03}deg)`,
        }}
      />
      <img
        src={karicaLogo.src}
        alt=""
        aria-hidden="true"
        className="absolute opacity-[0.02] w-24 h-24"
        style={{
          top: '60%',
          left: '50%',
          transform: `translateY(${scrollY * 0.2}px) rotate(${scrollY * 0.01}deg)`,
        }}
      />

      {/* Grid pattern with parallax */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          transform: `translateY(${scrollY * 0.1}px)`,
        }}
      />
    </div>
  );
}
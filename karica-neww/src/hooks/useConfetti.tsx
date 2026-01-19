import confetti from 'canvas-confetti';
import { useCallback } from 'react';

type ConfettiType = 'achievement' | 'points' | 'celebration' | 'energy';

export function useConfetti() {
  const fire = useCallback((type: ConfettiType = 'celebration') => {
    const colors = {
      achievement: ['#9EF01A', '#6CE5D5', '#FFD700'],
      points: ['#9EF01A', '#FFFFFF', '#6CE5D5'],
      celebration: ['#9EF01A', '#6CE5D5', '#FFD700', '#FF6B6B', '#4ECDC4'],
      energy: ['#9EF01A', '#00FF00', '#FFFF00', '#6CE5D5'],
    };

    const config = {
      achievement: {
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: colors.achievement,
      },
      points: {
        particleCount: 50,
        spread: 50,
        origin: { y: 0.7 },
        colors: colors.points,
        scalar: 0.8,
      },
      celebration: {
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: colors.celebration,
      },
      energy: {
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: colors.energy,
        shapes: ['circle', 'square'] as confetti.Shape[],
      },
    };

    confetti(config[type]);
  }, []);

  const fireMultiple = useCallback((type: ConfettiType = 'celebration') => {
    const colors = {
      achievement: ['#9EF01A', '#6CE5D5', '#FFD700'],
      points: ['#9EF01A', '#FFFFFF', '#6CE5D5'],
      celebration: ['#9EF01A', '#6CE5D5', '#FFD700', '#FF6B6B', '#4ECDC4'],
      energy: ['#9EF01A', '#00FF00', '#FFFF00', '#6CE5D5'],
    };

    const duration = 2000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000, colors: colors[type] };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  }, []);

  const fireSides = useCallback(() => {
    const colors = ['#9EF01A', '#6CE5D5', '#FFD700'];
    
    // Left side
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors,
    });
    
    // Right side
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors,
    });
  }, []);

  const fireStars = useCallback(() => {
    const defaults = {
      spread: 360,
      ticks: 50,
      gravity: 0,
      decay: 0.94,
      startVelocity: 30,
      colors: ['#9EF01A', '#FFD700', '#6CE5D5'],
      shapes: ['star'] as confetti.Shape[],
    };

    function shoot() {
      confetti({
        ...defaults,
        particleCount: 40,
        scalar: 1.2,
        shapes: ['star'] as confetti.Shape[],
      });

      confetti({
        ...defaults,
        particleCount: 10,
        scalar: 0.75,
        shapes: ['circle'] as confetti.Shape[],
      });
    }

    setTimeout(shoot, 0);
    setTimeout(shoot, 100);
    setTimeout(shoot, 200);
  }, []);

  return {
    fire,
    fireMultiple,
    fireSides,
    fireStars,
  };
}
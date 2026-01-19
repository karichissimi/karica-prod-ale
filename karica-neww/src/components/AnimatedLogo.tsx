import { useState, useEffect } from 'react';
import logo1a from '@/assets/karica-logo-1a.png'; // cresta bassa, occhi aperti
import logo1b from '@/assets/karica-logo-1b.png'; // cresta bassa, occhi chiusi
import logo2a from '@/assets/karica-logo-2a.png'; // cresta alta, occhi aperti
import logo2b from '@/assets/karica-logo-2b.png'; // cresta alta, occhi chiusi

interface AnimatedLogoProps {
  className?: string;
  duration?: number; // durata totale del ciclo in ms (default 7000ms)
}

// Sequenza animazione:
// 1. Cresta bassa, occhi aperti (1a) - 1500ms
// 2. Sbatte palpebre (1b) - 150ms
// 3. Cresta bassa, occhi aperti (1a) - 300ms
// 4. Sbatte palpebre (1b) - 150ms
// 5. Cresta bassa, occhi aperti (1a) - 500ms
// 6. Alza cresta, occhi aperti (2a) - 1500ms
// 7. Sbatte palpebre (2b) - 150ms
// 8. Cresta alta, occhi aperti (2a) - 300ms
// 9. Sbatte palpebre (2b) - 150ms
// 10. Cresta alta, occhi aperti (2a) - 500ms
// 11. Abbassa cresta (1a) - 1800ms (ritorno)

type FrameKey = '1a' | '1b' | '2a' | '2b';

const frames: { key: FrameKey; duration: number }[] = [
  { key: '1a', duration: 1500 }, // inizio, cresta bassa
  { key: '1b', duration: 150 },  // blink 1
  { key: '1a', duration: 300 },  // occhi aperti
  { key: '1b', duration: 150 },  // blink 2
  { key: '1a', duration: 500 },  // pausa prima di alzare
  { key: '2a', duration: 1500 }, // cresta alta
  { key: '2b', duration: 150 },  // blink 1
  { key: '2a', duration: 300 },  // occhi aperti
  { key: '2b', duration: 150 },  // blink 2
  { key: '2a', duration: 500 },  // pausa prima di abbassare
  { key: '1a', duration: 1800 }, // ritorna a cresta bassa
];

const logoMap: Record<FrameKey, any> = {
  '1a': logo1a,
  '1b': logo1b,
  '2a': logo2a,
  '2b': logo2b,
};

const AnimatedLogo = ({ className = "h-12 w-12" }: AnimatedLogoProps) => {
  const [frameIndex, setFrameIndex] = useState(0);
  const [prevFrameIndex, setPrevFrameIndex] = useState(0);

  const currentFrameKey = frames[frameIndex].key;
  const prevFrameKey = frames[prevFrameIndex].key;

  // Solo il cambio cresta (1a ↔ 2a) ha transizione, tutto il resto è istantaneo
  const isCrestTransition =
    (prevFrameKey === '1a' && currentFrameKey === '2a') ||
    (prevFrameKey === '2a' && currentFrameKey === '1a');

  useEffect(() => {
    const currentFrame = frames[frameIndex];

    const timer = setTimeout(() => {
      setPrevFrameIndex(frameIndex);
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, currentFrame.duration);

    return () => clearTimeout(timer);
  }, [frameIndex]);

  return (
    <div className={`relative ${className}`}>
      {Object.entries(logoMap).map(([key, src]) => {
        const isActive = currentFrameKey === key;

        // Transizione SOLO per cambio cresta, tutto il resto istantaneo
        const transitionStyle = isCrestTransition
          ? { transition: 'opacity 700ms cubic-bezier(0.34, 1.2, 0.64, 1)' }
          : {};

        return (
          <img
            key={key}
            src={typeof src === 'string' ? src : (src as any).src}
            alt="Karica"
            style={transitionStyle}
            className={`absolute inset-0 w-full h-full object-contain logo-glow
              ${isActive ? 'opacity-100' : 'opacity-0'}`}
          />
        );
      })}
    </div>
  );
};

export default AnimatedLogo;

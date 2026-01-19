import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, TrendingUp, Sparkles, CheckCircle2, Zap, Battery, BatteryCharging, ArrowRight, Star, BatteryFull, BatteryLow, BatteryMedium, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ANALYSIS_STEPS = [
  { icon: FileText, text: 'Lettura documento...', duration: 2500 },
  { icon: Zap, text: 'Estrazione dati...', duration: 3000 },
  { icon: TrendingUp, text: 'Calcolo proiezioni...', duration: 2000 },
  { icon: Sparkles, text: 'Elaborazione...', duration: 1500 },
];

// Karica sustainable energy palette
const COLORS = {
  darkBlue: '#203149',     // Blu scuro - background
  azure: '#0C86C7',        // Azzurro - accents  
  green: '#45FF4A',        // Verde - energy/success
  // Derived colors for UI
  darkBlueDark: '#172435', // Darker variant
  azureLight: '#3DA5D9',   // Lighter azure
  greenGlow: '#45FF4A80',  // Transparent green
  yellow: '#FFD93D',       // Sun/warning
};

interface AnalyzingLoaderProps {
  className?: string;
  onAnalysisComplete?: () => void;
  isAnalysisComplete?: boolean;
}

export const AnalyzingLoader = ({ className, onAnalysisComplete, isAnalysisComplete = false }: AnalyzingLoaderProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [analysisReady, setAnalysisReady] = useState(false);
  
  // Battery Game state
  const [batteryLevel, setBatteryLevel] = useState(0);
  const [level, setLevel] = useState(1);
  const [totalScore, setTotalScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [reachedFull, setReachedFull] = useState(false);
  const [showGlow, setShowGlow] = useState(false);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [tapStreak, setTapStreak] = useState(0);
  const [drainRate, setDrainRate] = useState(0.3); // % per frame
  const [sparks, setSparks] = useState<{ id: number; x: number; y: number }[]>([]);
  const [energyFlowIntensity, setEnergyFlowIntensity] = useState(0);
  
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('karica-battery-highscore-v1');
    return saved ? parseInt(saved, 10) : 0;
  });
  
  // Refs
  const gameLoopRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const batteryRef = useRef<HTMLDivElement>(null);

  // Difficulty scaling
  const baseDrain = 0.15 + (level - 1) * 0.08;
  const tapPower = Math.max(1.5, 3.5 - (level - 1) * 0.3);

  // Handle tap/click
  const handleTap = useCallback(() => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime;
    
    // Combo for rapid taps (under 300ms)
    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      setTapStreak(prev => Math.min(prev + 1, 10));
      setCombo(prev => {
        const newCombo = prev + 1;
        if (newCombo > maxCombo) setMaxCombo(newCombo);
        return newCombo;
      });
      // Increase energy flow intensity with rapid taps
      setEnergyFlowIntensity(prev => Math.min(prev + 0.2, 1));
    } else {
      setTapStreak(0);
      setCombo(0);
    }
    
    setLastTapTime(now);
    
    // Add energy with combo multiplier
    const comboMultiplier = 1 + tapStreak * 0.15;
    const energyGain = tapPower * comboMultiplier;
    
    setBatteryLevel(prev => {
      const newLevel = Math.min(100, prev + energyGain);
      
      // Check if reached 100%
      if (newLevel >= 100 && prev < 100) {
        setReachedFull(true);
        setShowGlow(true);
        
        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate([50, 50, 100]);
        }
        
        // Score and level up
        const bonus = 100 + combo * 10;
        setTotalScore(prevScore => {
          const newTotal = prevScore + bonus;
          if (newTotal > highScore) {
            setHighScore(newTotal);
            localStorage.setItem('karica-battery-highscore-v1', newTotal.toString());
          }
          return newTotal;
        });
        
        // Start next level after delay
        setTimeout(() => {
          setLevel(l => l + 1);
          setShowLevelUp(true);
          setTimeout(() => setShowLevelUp(false), 1500);
          setBatteryLevel(0);
          setReachedFull(false);
          setShowGlow(false);
          setDrainRate(baseDrain + 0.1);
        }, 800);
      }
      
      return newLevel;
    });
    
    // Visual spark effect
    if (batteryRef.current) {
      const rect = batteryRef.current.getBoundingClientRect();
      const sparkX = rect.width * 0.3 + Math.random() * rect.width * 0.4;
      const sparkY = rect.height * (1 - batteryLevel / 100) - 20 + Math.random() * 30;
      
      const newSpark = { id: Date.now() + Math.random(), x: sparkX, y: sparkY };
      setSparks(prev => [...prev, newSpark]);
      setTimeout(() => {
        setSparks(prev => prev.filter(s => s.id !== newSpark.id));
      }, 500);
    }
    
    // Haptic feedback for tap
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, [lastTapTime, tapStreak, tapPower, combo, maxCombo, highScore, batteryLevel, baseDrain]);

  // Game loop - battery drains over time
  useEffect(() => {
    if (reachedFull) return;

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      // Drain battery
      setBatteryLevel(prev => {
        if (prev <= 0) return 0;
        const drain = baseDrain * deltaTime * 60; // Normalize to ~60fps
        return Math.max(0, prev - drain);
      });
      
      // Decay combo if no taps
      const now = Date.now();
      if (now - lastTapTime > 500) {
        setCombo(prev => Math.max(0, prev - deltaTime * 3));
        setTapStreak(0);
        // Decay energy flow intensity
        setEnergyFlowIntensity(prev => Math.max(0, prev - deltaTime * 0.5));
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [reachedFull, baseDrain, lastTapTime]);

  // Analysis progress (independent of game)
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => prev >= 100 ? 100 : prev + Math.random() * 2);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const stepTimers = ANALYSIS_STEPS.map((_, index) => {
      const delay = ANALYSIS_STEPS.slice(0, index).reduce((acc, s) => acc + s.duration, 0);
      return setTimeout(() => setCurrentStep(index), delay);
    });

    const totalDuration = ANALYSIS_STEPS.reduce((acc, s) => acc + s.duration, 0);
    const completeTimer = setTimeout(() => setProgress(100), totalDuration);

    return () => {
      stepTimers.forEach(clearTimeout);
      clearTimeout(completeTimer);
    };
  }, []);

  useEffect(() => {
    if (isAnalysisComplete || progress >= 100) {
      setAnalysisReady(true);
    }
  }, [isAnalysisComplete, progress]);

  // Get battery color based on level - using new palette
  const getBatteryColor = () => {
    if (batteryLevel >= 80) return COLORS.green;
    if (batteryLevel >= 50) return COLORS.azureLight;
    if (batteryLevel >= 25) return COLORS.yellow;
    return '#FF6B6B'; // Warning red
  };

  // Get battery icon based on level
  const BatteryIcon = () => {
    if (batteryLevel >= 90) return BatteryFull;
    if (batteryLevel >= 50) return BatteryMedium;
    if (batteryLevel >= 20) return BatteryLow;
    return Battery;
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col overflow-hidden select-none ${className}`}
      style={{
        background: `linear-gradient(180deg, ${COLORS.darkBlueDark} 0%, ${COLORS.darkBlue} 40%, ${COLORS.azure}40 100%)`,
      }}
      onClick={handleTap}
      onTouchStart={(e) => {
        e.preventDefault();
        handleTap();
      }}
    >
      {/* Sun with animated glow - top right */}
      <div className="absolute top-12 right-8 pointer-events-none">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="relative"
        >
          {/* Sun glow */}
          <div 
            className="absolute inset-0 rounded-full blur-xl"
            style={{
              width: 80,
              height: 80,
              background: `radial-gradient(circle, ${COLORS.yellow}80 0%, ${COLORS.yellow}00 70%)`,
              transform: 'translate(-10px, -10px)',
            }}
          />
          <Sun 
            className="w-16 h-16" 
            style={{ 
              color: COLORS.yellow,
              filter: 'drop-shadow(0 0 15px rgba(255, 217, 61, 0.6))',
            }} 
          />
        </motion.div>
      </div>

      {/* Solar Panel - bottom left */}
      <div className="absolute bottom-32 left-4 pointer-events-none">
        <div className="relative">
          {/* Panel base/stand */}
          <div 
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-8"
            style={{ background: COLORS.azure }}
          />
          {/* Solar panel cells */}
          <div 
            className="grid grid-cols-3 gap-0.5 p-1 rounded-sm rotate-[-15deg]"
            style={{ 
              background: COLORS.darkBlueDark,
              border: `2px solid ${COLORS.azure}`,
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-5 h-4 rounded-sm"
                style={{ 
                  background: `linear-gradient(135deg, ${COLORS.azure} 0%, ${COLORS.darkBlue} 100%)`,
                }}
                animate={{
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.2,
                  repeat: Infinity,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Energy flow lines - from panel to battery */}
      <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
        <defs>
          <linearGradient id="energyGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={COLORS.azure} stopOpacity="0.3" />
            <stop offset="50%" stopColor={COLORS.green} stopOpacity={0.3 + energyFlowIntensity * 0.5} />
            <stop offset="100%" stopColor={COLORS.green} stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {/* Energy flow path */}
        <motion.path
          d="M 70 calc(100% - 180) Q 120 calc(50%) 50% calc(50%)"
          fill="none"
          stroke="url(#energyGradient)"
          strokeWidth={2 + energyFlowIntensity * 3}
          strokeLinecap="round"
          strokeDasharray="8 4"
          animate={{
            strokeDashoffset: [0, -24],
          }}
          transition={{
            duration: 1 - energyFlowIntensity * 0.5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        {/* Energy particles along path */}
        {energyFlowIntensity > 0.3 && (
          <motion.circle
            r={3 + energyFlowIntensity * 2}
            fill={COLORS.green}
            animate={{
              cx: [70, 120, '50%'],
              cy: ['calc(100% - 180)', 'calc(50%)', 'calc(50%)'],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 1.5 - energyFlowIntensity * 0.5,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        )}
      </svg>

      {/* Glow effect when battery full */}
      <AnimatePresence>
        {showGlow && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, repeat: 3 }}
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${COLORS.green}60 0%, transparent 60%)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Top HUD */}
      <div className="relative z-20 p-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          {/* Analysis progress - compact */}
          <div 
            className="flex items-center gap-2 rounded-full px-3 py-1.5 shadow-lg backdrop-blur-sm"
            style={{ background: `${COLORS.darkBlue}CC` }}
          >
            {analysisReady ? (
              <CheckCircle2 className="w-4 h-4" style={{ color: COLORS.green }} />
            ) : (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              >
                <Zap className="w-4 h-4" style={{ color: COLORS.azure }} />
              </motion.div>
            )}
            <span className="text-xs font-medium text-white">
              {analysisReady ? '✓ Pronto' : `${Math.round(progress)}%`}
            </span>
          </div>

          {/* Score & Level */}
          <div className="flex items-center gap-2">
            <div 
              className="rounded-full px-3 py-1.5 shadow-lg backdrop-blur-sm"
              style={{ background: `${COLORS.darkBlue}CC` }}
            >
              <span className="text-xs font-bold" style={{ color: COLORS.azure }}>LV.{level}</span>
            </div>
            <div 
              className="rounded-full px-3 py-1.5 shadow-lg backdrop-blur-sm flex items-center gap-1"
              style={{ background: `${COLORS.darkBlue}CC` }}
            >
              <Star className="w-3 h-3" style={{ color: COLORS.yellow, fill: COLORS.yellow }} />
              <span className="text-xs font-bold text-white">{Math.round(totalScore)}</span>
            </div>
          </div>
        </div>

        {/* Combo indicator */}
        <div className="flex items-center justify-center gap-2">
          <AnimatePresence>
            {combo > 2 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="px-4 py-1.5 rounded-full font-bold text-white shadow-lg"
                style={{ 
                  background: `linear-gradient(135deg, ${COLORS.azure}, ${COLORS.green})`,
                }}
              >
                ⚡ x{Math.floor(combo)} COMBO!
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Game area - Battery */}
      <div className="flex-1 flex flex-col items-center justify-center relative px-8">
        {/* Title */}
        <motion.h2 
          className="text-2xl font-bold text-white mb-6 text-center"
          animate={{ scale: combo > 3 ? [1, 1.05, 1] : 1 }}
          transition={{ duration: 0.2 }}
        >
          <BatteryCharging className="inline-block w-7 h-7 mr-2 mb-1" style={{ color: COLORS.green }} />
          Carica la Batteria!
        </motion.h2>

        {/* Battery container */}
        <div 
          ref={batteryRef}
          className="relative w-40 h-72 rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: `linear-gradient(180deg, ${COLORS.darkBlue} 0%, ${COLORS.darkBlueDark} 100%)`,
            border: `4px solid ${COLORS.azure}`,
          }}
        >
          {/* Battery terminal */}
          <div 
            className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 rounded-t-lg"
            style={{
              background: `linear-gradient(180deg, ${COLORS.azure} 0%, ${COLORS.darkBlue} 100%)`,
              border: `3px solid ${COLORS.azure}`,
              borderBottom: 'none',
            }}
          />

          {/* Energy fill */}
          <motion.div
            className="absolute bottom-0 left-0 right-0"
            style={{
              height: `${batteryLevel}%`,
              background: `linear-gradient(180deg, ${getBatteryColor()}CC 0%, ${getBatteryColor()} 100%)`,
            }}
            animate={{
              boxShadow: combo > 2 
                ? [`0 0 20px ${getBatteryColor()}80`, `0 0 40px ${getBatteryColor()}60`, `0 0 20px ${getBatteryColor()}80`]
                : `0 0 20px ${getBatteryColor()}40`,
            }}
            transition={{ duration: 0.5, repeat: combo > 2 ? Infinity : 0 }}
          >
            {/* Animated wave */}
            <motion.div
              className="absolute top-0 left-0 right-0 h-4"
              style={{
                background: `linear-gradient(90deg, transparent, ${getBatteryColor()}99, transparent)`,
              }}
              animate={{ x: [-100, 100] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            
            {/* Energy particles */}
            <div className="absolute inset-0 overflow-hidden">
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: 4 + Math.random() * 6,
                    height: 4 + Math.random() * 6,
                    left: `${10 + Math.random() * 80}%`,
                    background: 'rgba(255,255,255,0.6)',
                  }}
                  animate={{
                    y: ['100%', '-100%'],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                    ease: 'linear',
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* Percentage display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span 
              className="text-5xl font-bold text-white drop-shadow-lg"
              animate={{ scale: reachedFull ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 0.3 }}
            >
              {Math.round(batteryLevel)}%
            </motion.span>
          </div>

          {/* Spark effects */}
          <AnimatePresence>
            {sparks.map(spark => (
              <motion.div
                key={spark.id}
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 2, opacity: 0, y: -30 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute pointer-events-none"
                style={{ left: spark.x, top: spark.y }}
              >
                <Zap className="w-6 h-6" style={{ color: COLORS.yellow, fill: COLORS.yellow }} />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Grid overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 h-px"
                style={{ 
                  top: `${(i + 1) * 25}%`,
                  background: COLORS.azure,
                }}
              />
            ))}
          </div>
        </div>

        {/* Tap instruction */}
        <motion.p 
          className="text-white/80 text-center mt-6 text-lg"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          👆 Tap veloce per caricare!
        </motion.p>

        {/* Level difficulty indicator */}
        <p className="text-white/50 text-xs mt-2">
          Velocità scarica: {(baseDrain * 100).toFixed(0)}%/s
        </p>
      </div>

      {/* Level up notification */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -50 }}
            className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30"
          >
            <div 
              className="text-white px-8 py-4 rounded-2xl shadow-2xl"
              style={{ background: `linear-gradient(135deg, ${COLORS.azure}, ${COLORS.green})` }}
            >
              <p className="text-2xl font-bold text-center">Livello {level}!</p>
              <p className="text-sm text-center opacity-80">Scarica più veloce!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom CTA - Analysis complete */}
      <AnimatePresence>
        {analysisReady && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="relative z-20 p-4"
            style={{ background: `linear-gradient(180deg, transparent, ${COLORS.darkBlue}CC)` }}
          >
            <div 
              className="rounded-2xl p-4 shadow-xl backdrop-blur-sm"
              style={{ background: `${COLORS.darkBlue}EE`, border: `1px solid ${COLORS.azure}40` }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: `${COLORS.green}30` }}
                >
                  <CheckCircle2 className="w-5 h-5" style={{ color: COLORS.green }} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">Analisi completata!</p>
                  <p className="text-xs" style={{ color: `${COLORS.green}CC` }}>
                    Punteggio: {Math.round(totalScore)} • Record: {highScore}
                  </p>
                </div>
              </div>
              
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  onAnalysisComplete?.();
                }}
                size="lg"
                className="w-full font-bold shadow-lg text-white border-0"
                style={{ 
                  background: `linear-gradient(135deg, ${COLORS.azure}, ${COLORS.green})`,
                }}
              >
                Vedi Risultati
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnalyzingLoader;
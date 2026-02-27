
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { AnimatedLogo } from './AnimatedLogo';
import { APP_NAME, TAGLINE } from '../constants';

interface SplashScreenProps {
  duration: number;
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ duration, onFinish }) => {
  const [stage, setStage] = useState<'converge' | 'ignite' | 'reveal' | 'stabilize' | 'exit'>('converge');
  const onFinishRef = useRef(onFinish);

  // Update ref to ensure we always have the latest callback without re-triggering effects
  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  // Procedural particles shooting from screen edges to the center for cinematic convergence
  const particles = useMemo(() => {
    return Array.from({ length: 90 }).map((_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const radius = 180 + Math.random() * 60; // Start outside the center focus
      return {
        id: i,
        startX: Math.cos(angle) * radius,
        startY: Math.sin(angle) * radius,
        delay: Math.random() * 900,
        size: Math.random() * 3.5 + 1,
        color: i % 3 === 0 ? '#22d3ee' : i % 3 === 1 ? '#8b5cf6' : '#ffffff',
        speed: 900 + Math.random() * 1100
      };
    });
  }, []);

  useEffect(() => {
    // Cinematic timeline orchestration - only runs once on mount
    const tIgnite = setTimeout(() => setStage('ignite'), 1000);
    const tReveal = setTimeout(() => setStage('reveal'), 1800);
    const tStabilize = setTimeout(() => setStage('stabilize'), 3000);
    const tExit = setTimeout(() => setStage('exit'), duration - 800);
    const tFinish = setTimeout(() => {
      onFinishRef.current();
    }, duration);

    return () => {
      clearTimeout(tIgnite);
      clearTimeout(tReveal);
      clearTimeout(tStabilize);
      clearTimeout(tExit);
      clearTimeout(tFinish);
    };
  }, [duration]);

  return (
    <div className={`fixed inset-0 z-[9999] bg-[#07070a] flex flex-col items-center justify-center transition-all duration-1000 cubic-bezier(0.19, 1, 0.22, 1) ${
      stage === 'exit' ? 'opacity-0 scale-125 blur-3xl' : 'opacity-100 scale-100 blur-0'
    }`}>
      
      {/* 60FPS Particle Convergence Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <div 
            key={p.id}
            className={`absolute w-1 h-1 rounded-full transition-all cubic-bezier(0.19, 1, 0.22, 1)`}
            style={{
              top: `calc(50% + ${stage === 'converge' ? p.startY : 0}%)`,
              left: `calc(50% + ${stage === 'converge' ? p.startX : 0}%)`,
              opacity: stage === 'converge' ? 0.8 : 0,
              backgroundColor: p.color,
              transform: stage === 'converge' ? `scale(1.5)` : `scale(0)`,
              transitionDuration: `${p.speed}ms`,
              transitionDelay: `${p.delay}ms`,
              boxShadow: `0 0 15px ${p.color}`,
              filter: 'blur(0.5px)'
            }}
          />
        ))}
      </div>

      {/* Neural Link Ignite Flash */}
      <div className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-1000 ${
        stage === 'ignite' ? 'opacity-10' : 'opacity-0'
      }`} />

      {/* Atmospheric Ground Glow */}
      <div className={`absolute bottom-[-15%] left-1/2 -translate-x-1/2 w-[160%] h-[50%] bg-cyan-500/10 rounded-full blur-[160px] transition-opacity duration-[3000ms] ${
        stage !== 'converge' ? 'opacity-100' : 'opacity-0'
      }`} />

      {/* Main Branding Experience */}
      <div className="relative flex flex-col items-center justify-center z-10">
        
        {/* Animated Logo Container with smooth acceleration */}
        <div className={`transition-all duration-[1600ms] cubic-bezier(0.34, 1.56, 0.64, 1) ${
          stage === 'converge' ? 'scale-0 opacity-0 rotate-[-270deg] blur-3xl' : 'scale-100 opacity-100 rotate-0 blur-0'
        }`}>
          <AnimatedLogo className="w-52 h-52 mb-16" animated={stage !== 'exit'} />
        </div>

        {/* Professional Typography Reveal System */}
        <div className="flex flex-col items-center px-6">
          <div className="relative overflow-hidden">
            <h1 className={`text-6xl font-black tracking-[0.5em] text-white italic transition-all duration-[1600ms] cubic-bezier(0.23, 1, 0.32, 1) ${
              ['reveal', 'stabilize', 'exit'].includes(stage) 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-24 blur-xl'
            }`}>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-indigo-400 drop-shadow-[0_0_30px_rgba(34,211,238,0.3)]">
                {APP_NAME}
              </span>
            </h1>
            
            {/* Cinematic Scanning Text Shine */}
            <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full ${
              stage === 'reveal' ? 'animate-[nexus-text-shine_2.5s_ease-in-out_forwards]' : 'hidden'
            }`} />
          </div>
          
          {/* Energy Divider Beam */}
          <div className={`mt-10 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent transition-all duration-[2500ms] ${
            ['reveal', 'stabilize', 'exit'].includes(stage) ? 'w-64 opacity-100' : 'w-0 opacity-0'
          }`}>
             <div className="absolute top-0 left-0 w-full h-full bg-cyan-400 blur-[5px] opacity-40 animate-pulse" />
          </div>

          <p className={`mt-12 text-[11px] font-black text-slate-400 uppercase tracking-[0.9em] transition-all duration-1200 delay-700 ${
            ['stabilize', 'exit'].includes(stage) ? 'opacity-80 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            {TAGLINE}
          </p>
        </div>
      </div>

      {/* Environmental Textures */}
      {/* 1. Perspective Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.95)_100%)]" />
      
      {/* 2. Neural Fiber Overlay (Scanlines) */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.08)_50%),linear-gradient(90deg,rgba(255,0,0,0.01),rgba(0,255,0,0.01),rgba(34,211,238,0.02))] bg-[length:100%_4px,4px_100%] z-[60] opacity-40" />

      <style>{`
        @keyframes nexus-text-shine {
          0% { transform: translateX(-150%) skewX(-30deg); }
          100% { transform: translateX(300%) skewX(-30deg); }
        }
      `}</style>
    </div>
  );
};

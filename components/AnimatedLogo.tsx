
import React from 'react';

export const AnimatedLogo: React.FC<{ className?: string; animated?: boolean }> = ({ className, animated = true }) => {
  return (
    <div className={`relative ${className} flex items-center justify-center`}>
      {/* Volumetric Depth Glow */}
      <div className={`absolute inset-0 rounded-full bg-cyan-500/10 blur-[80px] ${animated ? 'animate-pulse' : 'opacity-0'} pointer-events-none`} />
      
      <svg viewBox="0 0 200 200" className={`w-full h-full drop-shadow-[0_0_50px_rgba(34,211,238,0.4)] ${animated ? 'animate-[nexus-float_6s_ease-in-out_infinite]' : ''}`}>
        <defs>
          <linearGradient id="nexus-metal-silver" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
          <linearGradient id="nexus-energy-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#0891b2" />
            <stop offset="100%" stopColor="#083344" />
          </linearGradient>
          <linearGradient id="nexus-plasma-purple" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="50%" stopColor="#7e22ce" />
            <stop offset="100%" stopColor="#3b0764" />
          </linearGradient>
          <linearGradient id="nexus-deep-blue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
          
          <filter id="nexus-iron-shine" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
            <feSpecularLighting in="blur" surfaceScale="6" specularConstant="0.9" specularExponent="35" lightingColor="#ffffff" result="spec">
              <fePointLight x="-50" y="-120" z="250" />
            </feSpecularLighting>
            <feComposite in="spec" in2="SourceAlpha" operator="in" result="specOut" />
            <feComposite in="SourceGraphic" in2="specOut" operator="over" />
          </filter>

          <mask id="nexus-sphere-mask">
            <circle cx="100" cy="100" r="100" fill="white" />
          </mask>
        </defs>

        <g className={animated ? "animate-[nexus-rotation_45s_linear_infinite]" : ""} filter="url(#nexus-iron-shine)" mask="url(#nexus-sphere-mask)">
          {/* Neural Swirl Segment 1: Chrome */}
          <path 
            d="M100,10 C140,10 180,50 180,100 C150,90 120,85 100,90 C80,95 70,110 70,140 C65,100 75,30 100,10" 
            fill="url(#nexus-metal-silver)" 
            className={animated ? "animate-[nexus-breathe_8s_ease-in-out_infinite]" : ""}
          />
          
          {/* Neural Swirl Segment 2: Deep Energy */}
          <path 
            d="M190,100 C190,140 150,180 100,180 C110,150 115,120 110,100 C105,80 90,70 60,70 C100,65 170,75 190,100" 
            fill="url(#nexus-deep-blue)" 
            className={animated ? "animate-[nexus-breathe_8s_ease-in-out_infinite_2s]" : ""}
          />

          {/* Neural Swirl Segment 3: Cyan Pulse */}
          <path 
            d="M100,190 C60,190 20,150 20,100 C50,110 80,115 100,110 C120,105 130,90 130,60 C135,100 125,170 100,190" 
            fill="url(#nexus-energy-cyan)" 
            className={animated ? "animate-[nexus-breathe_8s_ease-in-out_infinite_4s]" : ""}
          />

          {/* Neural Swirl Segment 4: Plasma Void */}
          <path 
            d="M10,100 C10,60 50,20 100,20 C90,50 85,80 90,100 C95,120 110,130 140,130 C100,135 30,125 10,100" 
            fill="url(#nexus-plasma-purple)" 
            className={animated ? "animate-[nexus-breathe_8s_ease-in-out_infinite_6s]" : ""}
          />
        </g>
        
        {/* Central Core Singularity */}
        <g>
          <circle cx="100" cy="100" r="14" fill="white" opacity="0.4" className="animate-pulse" />
          <circle cx="100" cy="100" r="9" fill="white" className="drop-shadow-[0_0_15px_white]">
            <animate attributeName="r" values="8;11;8" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;1;0.8" dur="3s" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>

      <style>{`
        @keyframes nexus-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(2deg); }
        }
        @keyframes nexus-rotation {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes nexus-breathe {
          0%, 100% { filter: brightness(1) saturate(1); }
          50% { filter: brightness(1.35) saturate(1.4); }
        }
      `}</style>
    </div>
  );
};

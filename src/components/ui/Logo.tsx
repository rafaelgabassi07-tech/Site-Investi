import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  variant?: 'default' | 'white' | 'blue';
}

export function Logo({ className = "", size = 40, showText = false, variant = 'default' }: LogoProps) {
  const colors = {
    default: 'text-white',
    white: 'text-white',
    blue: 'text-blue-400'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div 
        className={`relative flex items-center justify-center transition-all duration-700 group-hover:rotate-[360deg]`}
        style={{ width: size, height: size }}
      >
        {/* Abstract Background Glow */}
        <div className="absolute inset-0 bg-blue-600/30 blur-2xl rounded-full opacity-40 group-hover:opacity-80 transition-opacity" />
        
        {/* Logo Container - Ultra Dark Blue with glass effect */}
        <div className="relative w-full h-full bg-[#020617] border border-white/10 rounded-xl flex items-center justify-center p-2 overflow-hidden shadow-2xl">
          {/* Subtle Shine Overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-white/5 pointer-events-none" />
          
          <svg 
            viewBox="0 0 100 100" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={`w-full h-full relative z-10 p-1`}
          >
            <defs>
              <linearGradient id="metalN" x1="0" y1="0" x2="0" y2="100%">
                <stop offset="0%" stopColor="#f8fafc" /> 
                <stop offset="50%" stopColor="#94a3b8" /> 
                <stop offset="100%" stopColor="#475569" /> 
              </linearGradient>
            </defs>

            {/* The Geometric 'N' - Metallic */}
            <path 
              d="M28 20 H38 L62 65 V20 H72 V80 H62 L38 35 V80 H28 V20 Z" 
              fill="url(#metalN)"
              className="drop-shadow-lg"
            />

            {/* Text Below N - INVEST */}
            <text 
              x="50" y="93" 
              textAnchor="middle" 
              fill="#94a3b8" 
              fontSize="10" 
              fontWeight="900" 
              letterSpacing="0.1em" 
              className="font-display uppercase italic text-xs tracking-widest"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              INVEST
            </text>
          </svg>
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="text-xl sm:text-2xl font-black tracking-tighter text-slate-800 dark:text-white leading-none uppercase italic">
              Nexus
            </span>
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 ml-0.5">
            <span className="text-[10px] sm:text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
              Invest
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  variant?: 'default' | 'white' | 'blue';
}

export function Logo({ className = "", size = 40, showText = false, variant = 'default' }: LogoProps) {
  const colors = {
    default: 'text-blue-500',
    white: 'text-white',
    blue: 'text-blue-400'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div 
        className={`relative flex items-center justify-center transition-all duration-700 group-hover:scale-105`}
        style={{ width: size, height: size }}
      >
        {/* Abstract Background Glow */}
        <div className="absolute inset-0 bg-blue-600/20 blur-2xl rounded-full opacity-60 group-hover:opacity-100 transition-opacity" />
        
        {/* Logo Container */}
        <div className="relative w-full h-full bg-slate-950 border border-white/10 rounded-2xl flex items-center justify-center p-1 overflow-hidden shadow-2xl overflow-hidden shadow-blue-900/10">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/5 to-transparent z-0" />
          
          <svg 
            viewBox="0 0 40 40" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={`w-full h-full relative z-10 ${colors[variant]}`}
          >
            {/* The "Nexus" Points - Converging towards the center */}
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="currentColor" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.5" />
              </linearGradient>
            </defs>

            {/* Stylized 'N' through three vertical pillars of connectivity */}
            <path 
              d="M12 28V12C12 12 18 19 20 22C22 25 28 12 28 12V28" 
              stroke="url(#logoGradient)" 
              strokeWidth="3.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
            />

            {/* Central Node - The Nexus Point */}
            <circle cx="20" cy="22" r="2.5" fill="currentColor" className="animate-pulse" />
            
            {/* Orbits - Representing different markets/assets */}
            <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 8" className="opacity-20 flex-shrink-0" />
            <circle cx="20" cy="20" r="12" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4" className="opacity-10 flex-shrink-0" />
            
            {/* Data points */}
            <circle cx="12" cy="12" r="1.5" fill="currentColor" className="opacity-80" />
            <circle cx="28" cy="28" r="1.5" fill="currentColor" className="opacity-80" />
          </svg>
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="text-xl sm:text-2xl font-black tracking-tighter text-white leading-none uppercase italic group-hover:text-blue-500 transition-colors">
            Nexus
          </span>
          <div className="flex items-center gap-1.5 mt-0.5 ml-0.5">
            <span className="text-[8px] sm:text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">
              Invest
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-blue-500/50 to-transparent min-w-[20px]" />
          </div>
        </div>
      )}
    </div>
  );
}

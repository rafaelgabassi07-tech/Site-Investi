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
              <linearGradient id="nexusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
              
              <linearGradient id="nexusAccent" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>

              <filter id="nexusGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* The Geometric 'N' - Clean Version */}
            <g filter="url(#nexusGlow)">
              {/* Main N Shape */}
              <path 
                d="M25 20 V80 H38 V45 L62 80 H75 V20 H62 V55 L38 20 H25 Z" 
                fill="url(#nexusGradient)"
                opacity="1"
              />
              
              {/* Accent Detail */}
              <circle cx="50" cy="50" r="1" fill="white" opacity="0.5" />
            </g>

            {/* Text Below N */}
            <text 
              x="50" y="93" 
              textAnchor="middle" 
              fill="url(#nexusAccent)" 
              fontSize="10" 
              fontWeight="800" 
              letterSpacing="0.3em" 
              className="font-bold uppercase tracking-widest"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              NEXUS
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
            <span className="text-[8px] sm:text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] italic">
              Invest
            </span>
            <div className="h-0.5 flex-1 bg-gradient-to-r from-blue-500/50 via-blue-500/10 to-transparent min-w-[20px] rounded-full" />
          </div>
        </div>
      )}
    </div>
  );
}

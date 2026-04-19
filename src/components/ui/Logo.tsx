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
        <div className="relative w-full h-full bg-[#020617] border border-white/20 rounded-xl flex items-center justify-center p-2 overflow-hidden shadow-2xl ring-1 ring-white/10">
          {/* Metallic Texture Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/40 pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none" />
          
          <svg 
            viewBox="0 0 100 100" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={`w-full h-full relative z-10`}
          >
            <defs>
              <linearGradient id="nexusMetal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="25%" stopColor="#94a3b8" />
                <stop offset="50%" stopColor="#f1f5f9" />
                <stop offset="75%" stopColor="#475569" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
              
              <linearGradient id="nexusAccent" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>

              <filter id="nexusGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              
              <linearGradient id="shineGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="white" stopOpacity="0" />
                <stop offset="50%" stopColor="white" stopOpacity="0.4" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
                <animate 
                  attributeName="x1" 
                  from="-1" 
                  to="1" 
                  dur="4s" 
                  repeatCount="indefinite" 
                />
              </linearGradient>
            </defs>

            {/* Background Hex Grid (Subtle) */}
            <g opacity="0.1">
              <path d="M10 20 L20 10 M80 90 L90 80" stroke="currentColor" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.2" strokeDasharray="1 2" />
            </g>

            {/* The Geometric 'N' */}
            <g strokeLinejoin="round" strokeLinecap="round" filter="url(#nexusGlow)">
              {/* Left Pillar */}
              <path 
                d="M25 15 L40 15 L40 60 L25 75 Z" 
                fill="url(#nexusMetal)" 
                stroke="url(#nexusAccent)"
                strokeWidth="0.5"
              />
              
              {/* Diagonal Connector */}
              <path 
                d="M40 15 L75 70 L75 75 L60 75 L25 20 L25 15 Z" 
                fill="url(#nexusMetal)" 
                opacity="0.95"
                stroke="url(#nexusAccent)"
                strokeWidth="0.5"
              />

              {/* Right Pillar */}
              <path 
                d="M60 15 L75 15 L75 75 L60 30 Z" 
                fill="url(#nexusMetal)"
                stroke="url(#nexusAccent)"
                strokeWidth="0.5"
              />

              {/* Shine Overlay */}
              <path 
                d="M25 15 L75 75 L75 75 L25 15 Z" 
                fill="url(#shineGradient)"
                opacity="0.5"
              />
            </g>

            {/* Text Below N */}
            <text 
              x="50" y="92" 
              textAnchor="middle" 
              fill="url(#nexusAccent)" 
              fontSize="12" 
              fontWeight="900" 
              letterSpacing="0.1em" 
              className="font-black italic uppercase"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              INVEST
            </text>

            {/* Tech Dots */}
            <g>
              <circle cx="25" cy="15" r="1.5" fill="#2563eb">
                <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="75" cy="75" r="1.5" fill="#06b6d4">
                <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" delay="1s" />
              </circle>
            </g>
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

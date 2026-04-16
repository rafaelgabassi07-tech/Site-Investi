import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  variant?: 'default' | 'white' | 'blue';
}

export function Logo({ className = "", size = 40, showText = false, variant = 'default' }: LogoProps) {
  const colors = {
    default: 'text-blue-600',
    white: 'text-white',
    blue: 'text-blue-500'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div 
        className={`relative flex items-center justify-center rounded-2xl overflow-hidden transition-all duration-700 group-hover:scale-110 shadow-2xl shadow-blue-500/20`}
        style={{ width: size, height: size }}
      >
        {/* Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/40 to-cyan-500/40 blur-xl -z-10 animate-pulse" />
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm -z-5" />
        
        {/* Logo SVG */}
        <svg 
          viewBox="0 0 32 32" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className={`w-full h-full p-1.5 ${colors[variant]}`}
        >
          {/* Outer Ring */}
          <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" className="opacity-30" />
          
          {/* Main "N" Shape - Stylized as a connection/nexus */}
          <path 
            d="M10 22V10L22 22V10" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="drop-shadow-[0_0_12px_rgba(37,99,235,0.8)]"
          />
          
          {/* Central Connection Node */}
          <circle cx="16" cy="16" r="2.5" fill="currentColor" className="animate-pulse shadow-[0_0_10px_currentColor]" />
          
          {/* Accent Dots */}
          <circle cx="10" cy="10" r="1.2" fill="currentColor" />
          <circle cx="22" cy="22" r="1.2" fill="currentColor" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="text-xl sm:text-2xl font-black tracking-tighter text-white leading-none uppercase italic">
            Nexus
          </span>
          <span className="text-[8px] sm:text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mt-0.5 ml-0.5">
            Invest
          </span>
        </div>
      )}
    </div>
  );
}

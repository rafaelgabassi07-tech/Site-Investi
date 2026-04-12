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
        className={`relative flex items-center justify-center rounded-xl overflow-hidden transition-all duration-500 group-hover:scale-110`}
        style={{ width: size, height: size }}
      >
        {/* Background Glow */}
        <div className="absolute inset-0 bg-blue-600/20 blur-lg -z-10 animate-pulse" />
        
        {/* Logo SVG */}
        <svg 
          viewBox="0 0 32 32" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className={`w-full h-full ${colors[variant]}`}
        >
          {/* Outer Ring */}
          <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" className="opacity-20" />
          
          {/* Main "N" Shape - Stylized as a connection/nexus */}
          <path 
            d="M10 22V10L22 22V10" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="drop-shadow-[0_0_8px_rgba(37,99,235,0.5)]"
          />
          
          {/* Central Connection Node */}
          <circle cx="16" cy="16" r="3" fill="currentColor" className="animate-pulse" />
          
          {/* Accent Dots */}
          <circle cx="10" cy="10" r="1.5" fill="currentColor" />
          <circle cx="22" cy="22" r="1.5" fill="currentColor" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-black tracking-tighter text-white leading-none uppercase">
            Nexus
          </span>
          <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mt-0.5">
            Invest
          </span>
        </div>
      )}
    </div>
  );
}

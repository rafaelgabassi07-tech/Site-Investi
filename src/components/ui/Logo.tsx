import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  variant?: 'default' | 'white' | 'blue';
}

export function Logo({ className = "", size = 40, showText = false, variant = 'default' }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div 
        className={`relative flex items-center justify-center transition-all duration-500`}
        style={{ width: size, height: size }}
      >
        {/* Logo Container - Solid Sophistication */}
        <div className="relative w-full h-full bg-primary border border-primary/20 rounded-lg flex items-center justify-center p-1.5 shadow-sm overflow-hidden">
          <svg 
            viewBox="0 0 100 100" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={`w-full h-full relative z-10`}
          >
            {/* The Geometric 'N' - Clean White */}
            <path 
              d="M28 20 H38 L62 65 V20 H72 V80 H62 L38 35 V80 H28 V20 Z" 
              fill="white"
            />
          </svg>
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-display font-extrabold tracking-tighter text-foreground leading-none uppercase">
              Nexus
            </span>
            <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-sm" />
          </div>
          <div className="mt-0.5 ml-0.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">
              Intelligence
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

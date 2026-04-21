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
        className="relative flex items-center justify-center transition-all duration-500"
        style={{ width: size, height: size }}
      >
        {/* Usando o mesmo logo do PWA para padronização */}
        <img 
          src="/logo.svg" 
          alt="Nexus Invest" 
          className="w-full h-full object-contain rounded-xl shadow-sm"
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-display font-extrabold tracking-tighter text-foreground leading-none uppercase">
              Nexus
            </span>
            <div className="w-1.5 h-1.5 rounded-full shadow-sm bg-blue-500" />
          </div>
          <div className="mt-0.5 ml-0.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] font-sans italic">
              Invest
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

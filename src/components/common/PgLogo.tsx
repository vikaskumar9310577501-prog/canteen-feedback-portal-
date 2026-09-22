import React from 'react';
import { PG_LOGO_DATA_URI } from '../../lib/pgLogoData';

interface Props {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const PgLogo: React.FC<Props> = ({ 
  className = '', 
  showText = true, 
  size = 'lg' 
}) => {
  const heightClasses = {
    sm: 'h-8 sm:h-9',
    md: 'h-10 sm:h-11',
    lg: 'h-11 sm:h-12 md:h-13',
    xl: 'h-16 sm:h-20',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Official PG Logo (100% Reliable Bundled HD Data URI) */}
      <img
        src={PG_LOGO_DATA_URI}
        alt="PG Logo"
        className={`${heightClasses[size]} w-auto object-contain shrink-0`}
        loading="eager"
      />

      {/* Brand Title: PG CANTEEN PORTAL */}
      {showText && (
        <div className="flex items-center gap-2 border-l-2 border-slate-200 pl-3">
          <span className="text-sm sm:text-base md:text-lg font-black text-slate-900 tracking-tight whitespace-nowrap">
            PG CANTEEN PORTAL
          </span>
          <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider hidden sm:inline-block shadow-2xs border border-emerald-200">
            LIVE
          </span>
        </div>
      )}
    </div>
  );
};

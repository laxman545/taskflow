import React from 'react';

interface NamasteLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'horizontal' | 'mark-only';
  className?: string;
  showTagline?: boolean;
}

export const NamasteLogo: React.FC<NamasteLogoProps> = ({
  size = 'md',
  variant = 'full',
  className = '',
  showTagline = true,
}) => {
  const getDimensions = () => {
    switch (size) {
      case 'sm':
        return { mark: 36, text: 'text-sm', subText: 'text-[10px]' };
      case 'lg':
        return { mark: 96, text: 'text-2xl', subText: 'text-sm' };
      case 'xl':
        return { mark: 140, text: 'text-4xl', subText: 'text-base' };
      case 'md':
      default:
        return { mark: 56, text: 'text-lg', subText: 'text-xs' };
    }
  };

  const dim = getDimensions();

  // The distinctive Namaste Print "N" with QR-pixelated left stem and Nepal Flag peak
  const LogoMark = (
    <svg
      width={dim.mark}
      height={dim.mark}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 select-none filter drop-shadow-sm"
    >
      {/* Background soft glow / base */}
      <defs>
        <linearGradient id="blueStem" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0842B0" />
          <stop offset="100%" stopColor="#002D80" />
        </linearGradient>
        <linearGradient id="flagRed" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E61A24" />
          <stop offset="100%" stopColor="#C91019" />
        </linearGradient>
      </defs>

      {/* QR Code Pixel Matrix elements on top-left of N */}
      {/* QR Main Finder Square Outer */}
      <rect x="25" y="35" width="42" height="42" rx="3" fill="#0842B0" />
      <rect x="33" y="43" width="26" height="26" rx="2" fill="#FFFFFF" />
      <rect x="39" y="49" width="14" height="14" rx="1" fill="#0842B0" />

      {/* Scattered QR pixel blocks forming the top portion of the left stem */}
      <rect x="73" y="35" width="12" height="12" rx="1" fill="#0842B0" />
      <rect x="88" y="35" width="12" height="12" rx="1" fill="#0842B0" />
      <rect x="73" y="50" width="12" height="12" rx="1" fill="#0842B0" />
      <rect x="25" y="82" width="12" height="12" rx="1" fill="#0842B0" />
      <rect x="40" y="82" width="12" height="12" rx="1" fill="#0842B0" />
      <rect x="67" y="66" width="18" height="18" rx="1" fill="#0842B0" />
      <rect x="25" y="98" width="12" height="12" rx="1" fill="#0842B0" />
      <rect x="42" y="98" width="12" height="12" rx="1" fill="#0842B0" />
      <rect x="58" y="98" width="12" height="12" rx="1" fill="#0842B0" />

      {/* Solid Left Pillar Base */}
      <rect x="25" y="112" width="42" height="60" rx="3" fill="url(#blueStem)" />

      {/* Diagonal Connecting Bridge of N */}
      <path
        d="M60 76 L130 148 L170 148 L95 76 Z"
        fill="url(#blueStem)"
      />

      {/* Right Vertical Pillar of N */}
      <rect x="130" y="72" width="40" height="100" rx="3" fill="url(#blueStem)" />

      {/* Nepal Flag (Top Right Triangle / Pennant) */}
      <path
        d="M128 66 L175 66 L128 32 Z"
        fill="url(#flagRed)"
      />
      {/* Flag Sun Emblem (White 12-pointed Sun) */}
      <circle cx="145" cy="53" r="5" fill="#FFFFFF" />
      {/* Sun rays */}
      <path
        d="M145 44 L146.5 48 L151 46.5 L148.5 50.5 L153 53 L148.5 55.5 L151 59.5 L146.5 58 L145 62 L143.5 58 L139 59.5 L141.5 55.5 L137 53 L141.5 50.5 L139 46.5 L143.5 48 Z"
        fill="#FFFFFF"
      />
    </svg>
  );

  if (variant === 'mark-only') {
    return <div className={`inline-flex items-center ${className}`}>{LogoMark}</div>;
  }

  if (variant === 'horizontal') {
    return (
      <div className={`inline-flex items-center gap-2.5 ${className}`}>
        {LogoMark}
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span className="font-display font-black tracking-tight text-slate-950 text-lg">
              NAMASTE
            </span>
            <span className="font-display font-black tracking-tight text-red-600 text-lg">
              PRINT
            </span>
          </div>
          {showTagline && (
            <span className="text-[10px] font-semibold text-slate-500 tracking-normal mt-1">
              Scan · Upload · Print
            </span>
          )}
        </div>
      </div>
    );
  }

  // Full stacked lockup matching uploaded branding poster exactly
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      {LogoMark}
      <div className="mt-3">
        <h1 className="font-display font-black tracking-tight text-slate-950 text-2xl sm:text-3xl leading-none">
          NAMASTE
        </h1>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="h-[2px] w-5 bg-red-600 rounded-full"></span>
          <span className="font-display font-black tracking-widest text-red-600 text-base sm:text-lg leading-none">
            PRINT
          </span>
          <span className="h-[2px] w-5 bg-red-600 rounded-full"></span>
        </div>
        {showTagline && (
          <p className="text-xs font-semibold text-slate-600 tracking-wide mt-1.5">
            Scan · Upload · Print
          </p>
        )}
      </div>
    </div>
  );
};

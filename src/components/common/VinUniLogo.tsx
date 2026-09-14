import React from 'react';

interface VinUniLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const VinUniLogo: React.FC<VinUniLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = false,
}) => {
  const heightClass = size === 'sm' ? 'h-8' : size === 'lg' ? 'h-13' : 'h-10';

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <img
        src="/cecs-logo.png"
        alt="VinUniversity - College of Engineering and Computer Science"
        className={`${heightClass} w-auto object-contain transition-transform group-hover:scale-[1.02] duration-150`}
        referrerPolicy="no-referrer"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = '/cecs-logo.svg';
        }}
      />
      {showSubtitle && (
        <div className="hidden sm:flex flex-col border-l border-[#D0D7DE] pl-2.5 ml-2.5 leading-tight">
          <span className="text-xs font-bold text-[#1F2328]">CECS</span>
          <span className="text-[10px] text-[#656D76]">College of Engineering &amp; Computer Science</span>
        </div>
      )}
    </div>
  );
};

// Export CECSLogo alias for semantic usage
export const CECSLogo = VinUniLogo;



import React from 'react';

interface VinUniLogoProps {
  size?: number;
}

export const VinUniLogo: React.FC<VinUniLogoProps> = ({ size = 56 }) => {
  return (
    <div className="flex items-center justify-center select-none py-1">
      {/* VinUni Geometric V-Shield SVG Logo matching Image 2 perfectly */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 940 820"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-200 hover:scale-105 shrink-0"
      >
        {/* Top-Left Red Triangle Accent */}
        <polygon points="50,0 250,190 50,380" fill="#C8232C" />

        {/* Diagonal Gap between Red Triangle and Blue Shield */}

        {/* Left Blue Wing (4 Facets) */}
        {/* Top-Outer Facet */}
        <polygon points="75,410 275,210 275,590" fill="#3B5C8F" />
        {/* Top-Inner Facet */}
        <polygon points="275,210 475,410 275,590" fill="#233E6B" />
        {/* Bottom-Outer Facet */}
        <polygon points="75,410 275,590 475,790" fill="#2B497B" />
        {/* Bottom-Inner Facet */}
        <polygon points="275,590 475,410 475,790" fill="#172B4D" />

        {/* Right Blue Wing (4 Facets - Symmetrical V Wing) */}
        {/* Top-Inner Facet */}
        <polygon points="475,410 675,210 675,590" fill="#233E6B" />
        {/* Top-Outer Facet */}
        <polygon points="675,210 875,10 675,590" fill="#3B5C8F" />
        {/* Bottom-Inner Facet */}
        <polygon points="475,410 675,590 475,790" fill="#172B4D" />
        {/* Bottom-Outer Facet */}
        <polygon points="675,590 875,10 475,790" fill="#2B497B" />
      </svg>
    </div>
  );
};

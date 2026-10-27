import React from 'react';
import { LanguageCode } from '../types';

export const UkFlag: React.FC<{ className?: string }> = ({ className = 'w-9 h-6' }) => (
  <svg
    viewBox="0 0 60 36"
    className={`${className} rounded-sm overflow-hidden shadow-xs ring-1 ring-black/15 flex-shrink-0`}
    xmlns="http://www.w3.org/2000/svg"
  >
    <clipPath id="uk-clip">
      <rect width="60" height="36" rx="2" />
    </clipPath>
    <g clipPath="url(#uk-clip)">
      {/* Blue field */}
      <rect width="60" height="36" fill="#012169" />
      {/* White diagonal saltire */}
      <path d="M0,0 L60,36 M60,0 L0,36" stroke="#FFFFFF" strokeWidth="7" />
      {/* Red diagonal saltire */}
      <path d="M0,0 L60,36 M60,0 L0,36" stroke="#C8102E" strokeWidth="4" />
      {/* White cross */}
      <path d="M30,0 v36 M0,18 h60" stroke="#FFFFFF" strokeWidth="11" />
      {/* Red cross */}
      <path d="M30,0 v36 M0,18 h60" stroke="#C8102E" strokeWidth="6.5" />
    </g>
  </svg>
);

export const SpainFlag: React.FC<{ className?: string }> = ({ className = 'w-9 h-6' }) => (
  <svg
    viewBox="0 0 60 36"
    className={`${className} rounded-sm overflow-hidden shadow-xs ring-1 ring-black/15 flex-shrink-0`}
    xmlns="http://www.w3.org/2000/svg"
  >
    <clipPath id="spain-clip">
      <rect width="60" height="36" rx="2" />
    </clipPath>
    <g clipPath="url(#spain-clip)">
      {/* Red top */}
      <rect width="60" height="9" fill="#AA151B" />
      {/* Yellow middle */}
      <rect y="9" width="60" height="18" fill="#F1BF00" />
      {/* Red bottom */}
      <rect y="27" width="60" height="9" fill="#AA151B" />
      {/* Coat of arms emblem */}
      <circle cx="18" cy="18" r="4.5" fill="#AA151B" opacity="0.9" />
      <circle cx="18" cy="18" r="3.2" fill="#F1BF00" />
      <rect x="16.5" y="16" width="3" height="4" fill="#AA151B" rx="1" />
    </g>
  </svg>
);

export const PortugalFlag: React.FC<{ className?: string }> = ({ className = 'w-9 h-6' }) => (
  <svg
    viewBox="0 0 60 36"
    className={`${className} rounded-sm overflow-hidden shadow-xs ring-1 ring-black/15 flex-shrink-0`}
    xmlns="http://www.w3.org/2000/svg"
  >
    <clipPath id="pt-clip">
      <rect width="60" height="36" rx="2" />
    </clipPath>
    <g clipPath="url(#pt-clip)">
      {/* Green section (2/5) */}
      <rect width="24" height="36" fill="#046A38" />
      {/* Red section (3/5) */}
      <rect x="24" width="36" height="36" fill="#DA291C" />
      {/* Armillary sphere (yellow) */}
      <circle cx="24" cy="18" r="6.5" fill="#FFDA44" />
      <circle cx="24" cy="18" r="5.5" fill="#046A38" />
      {/* White Portuguese shield */}
      <path
        d="M21 15 h6 v4 c0 2.5 -3 4.5 -3 4.5 s-3 -2 -3 -4.5 z"
        fill="#FFFFFF"
        stroke="#DA291C"
        strokeWidth="0.8"
      />
      {/* Blue quinas (cross) */}
      <circle cx="24" cy="17" r="0.8" fill="#002B7F" />
      <circle cx="24" cy="19.5" r="0.8" fill="#002B7F" />
      <circle cx="22.5" cy="18.2" r="0.8" fill="#002B7F" />
      <circle cx="25.5" cy="18.2" r="0.8" fill="#002B7F" />
    </g>
  </svg>
);

export const LanguageFlag: React.FC<{ code: LanguageCode; className?: string }> = ({
  code,
  className
}) => {
  switch (code) {
    case 'en':
      return <UkFlag className={className} />;
    case 'es':
      return <SpainFlag className={className} />;
    case 'pt':
      return <PortugalFlag className={className} />;
    default:
      return <UkFlag className={className} />;
  }
};

import React, { ReactNode } from 'react';

type UsdMarkProps = { className?: string; title?: string };

/** A responsive banknote mark used wherever the interface displays a USD amount. */
export const UsdMark: React.FC<UsdMarkProps> = ({ className = '', title = 'USD' }) => (
  <svg
    role="img"
    aria-label={title}
    viewBox="0 0 64 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 align-[-0.12em] ${className}`}
    style={{ width: '1.65em', height: '1.08em' }}
  >
    <title>{title}</title>
    <rect x="1.5" y="1.5" width="61" height="37" rx="5.5" fill="#16803C" stroke="#86EFAC" strokeWidth="3" />
    <rect x="6" y="5.5" width="52" height="29" rx="3" stroke="#D9F99D" strokeWidth="1.8" />
    <path d="M8 13c3.3 0 5.5-2.2 5.5-5.5M56 13c-3.3 0-5.5-2.2-5.5-5.5M8 27c3.3 0 5.5 2.2 5.5 5.5M56 27c-3.3 0-5.5 2.2-5.5 5.5" stroke="#BBF7D0" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="32" cy="20" r="11.5" fill="#0B5D2A" stroke="#BBF7D0" strokeWidth="1.6" />
    <path d="M35.5 14.7c-.9-.8-2.2-1.2-3.8-1.2-2.5 0-4.2 1.2-4.2 3s1.4 2.6 4.1 3.2c2.5.5 4 1.2 4 3s-1.7 3.1-4.3 3.1c-1.7 0-3.2-.6-4.3-1.6M32 11.5v17" stroke="#F0FDF4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const UsdAmount: React.FC<{ children: ReactNode; className?: string }> = ({ children, className = '' }) => (
  <span className={`inline-flex max-w-full min-w-0 items-baseline gap-[0.3em] align-middle ${className}`}>
    <UsdMark />
    <span className="min-w-0">{children}</span>
  </span>
);

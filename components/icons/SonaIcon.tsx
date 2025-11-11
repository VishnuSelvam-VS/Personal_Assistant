import React from 'react';

export const SonaIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor: '#22d3ee', stopOpacity: 1}} />
                <stop offset="100%" style={{stopColor: '#a855f7', stopOpacity: 1}} />
            </linearGradient>
        </defs>
        <path d="M50 2.5C23.76 2.5 2.5 23.76 2.5 50S23.76 97.5 50 97.5 97.5 76.24 97.5 50 76.24 2.5 50 2.5z" stroke="url(#grad1)" strokeWidth="5"/>
        <path d="M50 25C36.2 25 25 36.2 25 50s11.2 25 25 25 25-11.2 25-25-11.2-25-25-25z" stroke="url(#grad1)" strokeWidth="5" strokeDasharray="10 5" />
        <circle cx="50" cy="50" r="10" fill="url(#grad1)" />
    </svg>
);
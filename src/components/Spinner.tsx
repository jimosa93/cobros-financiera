'use client';

import React from 'react';

export default function Spinner({ size = 40 }: { size?: number }) {
  const borderSize = `${Math.max(3, Math.round(size / 10))}px`;
  const style: React.CSSProperties = {
    width: size,
    height: size,
    border: `${borderSize} solid #e5e7eb`,
    borderTopColor: '#0070f3',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    WebkitAnimation: 'spin 1s linear infinite',
    margin: '0 auto',
    display: 'block',
    boxSizing: 'border-box'
  };

  return <div style={style} aria-hidden />;
}


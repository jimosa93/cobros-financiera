'use client';

import React from 'react';

export default function Spinner({ size = 40 }: { size?: number }) {
  const style: React.CSSProperties = {
    width: size,
    height: size,
    border: `${Math.max(3, Math.round(size / 10))}px solid #e5e7eb`,
    borderTop: `${Math.max(3, Math.round(size / 10))}px solid #0070f3`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto',
  };
  return <div style={style} aria-hidden />;
}


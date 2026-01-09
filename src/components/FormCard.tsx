"use client";

import React from 'react';
import { cardStyle } from '@/styles/ui';

interface FormCardProps {
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
  titleCentered?: boolean;
}

export default function FormCard({ title, children, maxWidth = '600px', titleCentered = true }: FormCardProps) {
  return (
    <main style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ ...(cardStyle as any), width: '100%', maxWidth }}>
        {title && (
          <h1 style={{ marginBottom: '1.5rem', textAlign: titleCentered ? 'center' : 'left', color: '#333', fontWeight: 700, fontSize: '1.6rem' }}>
            {title}
          </h1>
        )}
        {children}
      </div>
    </main>
  );
}


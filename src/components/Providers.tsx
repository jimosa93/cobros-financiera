'use client';

import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from './Toast';
import { RutaProvider } from '@/contexts/RutaContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <RutaProvider>
        <ToastProvider>{children}</ToastProvider>
      </RutaProvider>
    </SessionProvider>
  );
}

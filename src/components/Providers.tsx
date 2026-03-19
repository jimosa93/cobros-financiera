'use client';

import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from './Toast';
import { RutaProvider } from '@/contexts/RutaContext';
import { PermissionsProvider } from '@/contexts/PermissionsContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PermissionsProvider>
        <RutaProvider>
          <ToastProvider>{children}</ToastProvider>
        </RutaProvider>
      </PermissionsProvider>
    </SessionProvider>
  );
}

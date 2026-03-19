'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { type Permiso } from '@/lib/permissionCatalog';
import { useSession } from 'next-auth/react';

type PermissionsState = {
  loading: boolean;
  permisos: Permiso[];
  can: (...required: Permiso[]) => boolean;
};

const PermissionsContext = createContext<PermissionsState | undefined>(undefined);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [permisos, setPermisos] = useState<Permiso[]>([]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) {
      setPermisos([]);
      setLoading(false);
      return;
    }

    // ADMIN sees everything (UI-wise). Backend still enforces.
    if (session.user.rol === 'ADMIN') {
      // Leave permisos empty; can() will allow via role.
      setPermisos([]);
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/users/me', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        const list = Array.isArray(data?.user?.permisos) ? (data.user.permisos as Permiso[]) : [];
        setPermisos(list);
      } finally {
        setLoading(false);
      }
    })();
  }, [session?.user, status]);

  const can = useMemo(() => {
    return (...required: Permiso[]) => {
      if (session?.user?.rol === 'ADMIN') return true;
      if (required.length === 0) return true;
      return required.some((p) => permisos.includes(p));
    };
  }, [permisos, session?.user?.rol]);

  const value = useMemo(() => ({ loading, permisos, can }), [loading, permisos, can]);

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error('usePermissions must be used within a PermissionsProvider');
  return ctx;
}


'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface Ruta {
  id: number;
  nombre: string;
  activo: boolean;
}

interface RutaContextType {
  rutaSeleccionada: number | null;
  setRutaSeleccionada: (rutaId: number | null) => void;
  rutas: Ruta[];
  loadingRutas: boolean;
}

const RutaContext = createContext<RutaContextType | undefined>(undefined);

export function RutaProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const [rutaSeleccionada, setRutaSeleccionadaState] = useState<number | null>(null);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [loadingRutas, setLoadingRutas] = useState(true);

  useEffect(() => {
    const savedRuta = localStorage.getItem('rutaSeleccionada');
    if (savedRuta) {
      setRutaSeleccionadaState(parseInt(savedRuta));
    }
  }, []);

  const fetchRutas = useCallback(async () => {
    try {
      setLoadingRutas(true);
      const res = await fetch('/api/rutas', { credentials: 'include' });
      if (!res.ok) {
        // Right after login, session cookies can still be settling in some navigations.
        // Retry once to avoid leaving the route selector empty until manual refresh.
        if (status === 'authenticated') {
          await new Promise((resolve) => setTimeout(resolve, 300));
          const retryRes = await fetch('/api/rutas', { credentials: 'include' });
          if (!retryRes.ok) return;
          const retryData = await retryRes.json();
          const loadedRutas: Ruta[] = retryData.rutas || [];
          setRutas(loadedRutas);
          if (loadedRutas.length === 0) {
            setRutaSeleccionada(null);
          } else if (loadedRutas.length === 1) {
            setRutaSeleccionada(loadedRutas[0].id);
          } else if (rutaSeleccionada && !loadedRutas.some((r) => r.id === rutaSeleccionada)) {
            setRutaSeleccionada(null);
          }
          return;
        }
        return;
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        // Likely redirected to /login (HTML) when unauthenticated.
        return;
      }

      const data = await res.json();
      const loadedRutas: Ruta[] = data.rutas || [];
      setRutas(loadedRutas);

      // Business rule:
      // - 0 routes: no selection
      // - 1 route: auto-select it and hide selector in UI
      // - 2+ routes: keep saved selection if valid, otherwise "all routes" (null)
      if (loadedRutas.length === 0) {
        setRutaSeleccionada(null);
      } else if (loadedRutas.length === 1) {
        setRutaSeleccionada(loadedRutas[0].id);
      } else if (rutaSeleccionada && !loadedRutas.some((r) => r.id === rutaSeleccionada)) {
        setRutaSeleccionada(null);
      }
    } catch (error) {
      console.error('Error loading rutas:', error);
    } finally {
      setLoadingRutas(false);
    }
  }, [rutaSeleccionada, status]);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      setRutas([]);
      setLoadingRutas(false);
      return;
    }
    fetchRutas();
  }, [status, fetchRutas]);

  const setRutaSeleccionada = (rutaId: number | null) => {
    setRutaSeleccionadaState(rutaId);
    if (rutaId === null) {
      localStorage.removeItem('rutaSeleccionada');
    } else {
      localStorage.setItem('rutaSeleccionada', rutaId.toString());
    }
  };

  return (
    <RutaContext.Provider
      value={{
        rutaSeleccionada,
        setRutaSeleccionada,
        rutas,
        loadingRutas,
      }}
    >
      {children}
    </RutaContext.Provider>
  );
}

export function useRuta() {
  const context = useContext(RutaContext);
  if (context === undefined) {
    throw new Error('useRuta must be used within a RutaProvider');
  }
  return context;
}

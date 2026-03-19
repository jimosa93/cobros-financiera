'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  const [rutaSeleccionada, setRutaSeleccionadaState] = useState<number | null>(null);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [loadingRutas, setLoadingRutas] = useState(true);

  useEffect(() => {
    const savedRuta = localStorage.getItem('rutaSeleccionada');
    if (savedRuta) {
      setRutaSeleccionadaState(parseInt(savedRuta));
    }
  }, []);

  useEffect(() => {
    fetchRutas();
  }, []);

  const fetchRutas = async () => {
    try {
      const res = await fetch('/api/rutas', { credentials: 'include' });
      if (!res.ok) return;

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        // Likely redirected to /login (HTML) when unauthenticated.
        return;
      }

      const data = await res.json();
      setRutas(data.rutas || []);
    } catch (error) {
      console.error('Error loading rutas:', error);
    } finally {
      setLoadingRutas(false);
    }
  };

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

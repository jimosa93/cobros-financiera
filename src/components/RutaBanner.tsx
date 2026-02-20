'use client';

import { useRuta } from '@/contexts/RutaContext';
import { useSession } from 'next-auth/react';

export function RutaBanner() {
  const { data: session } = useSession();
  const { rutaSeleccionada, rutas, setRutaSeleccionada } = useRuta();

  if (session?.user?.rol !== 'ADMIN' || !rutaSeleccionada) {
    return null;
  }

  const rutaActual = rutas.find(r => r.id === rutaSeleccionada);

  return (
    <div
      style={{
        backgroundColor: '#e3f2fd',
        borderLeft: '4px solid #1976d2',
        padding: '0.75rem 1rem',
        marginBottom: '1rem',
        borderRadius: '4px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '1.25rem' }}>🗺️</span>
        <span style={{ color: '#1565c0', fontWeight: '600', fontSize: '0.95rem' }}>
          Filtrando por ruta: <strong>{rutaActual?.nombre || 'Desconocida'}</strong>
        </span>
      </div>
      <button
        onClick={() => setRutaSeleccionada(null)}
        style={{
          padding: '0.4rem 0.75rem',
          backgroundColor: '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.85rem',
          fontWeight: '500'
        }}
      >
        Ver todas las rutas
      </button>
    </div>
  );
}

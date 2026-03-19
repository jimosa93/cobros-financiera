'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { usePermissions } from '@/contexts/PermissionsContext';

interface Ruta {
  id: number;
  nombre: string;
  activo: boolean;
  fechaCreacion: string;
  _count: {
    clientes: number;
    prestamos: number;
    usuarios: number;
  };
}

export default function RutasPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { can, loading: loadingPerms } = usePermissions();
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newRutaName, setNewRutaName] = useState('');
  const [creating, setCreating] = useState(false);

  const canAccess = !!session && can('RUTAS_READ', 'RUTAS_CREATE', 'RUTAS_UPDATE', 'RUTAS_DELETE');

  const fetchRutas = async () => {
    try {
      setLoading(true);
      const url = showInactive ? '/api/rutas?includeInactive=true' : '/api/rutas';
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Error al cargar rutas');
      const data = await res.json();
      setRutas(data.rutas);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar rutas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'loading' || loadingPerms) return;
    if (!session) {
      router.replace('/login');
      return;
    }
    if (!can('RUTAS_READ', 'RUTAS_CREATE', 'RUTAS_UPDATE', 'RUTAS_DELETE')) {
      router.replace('/');
    }
  }, [status, loadingPerms, session, can, router]);

  useEffect(() => {
    if (status === 'loading' || loadingPerms) return;
    if (!canAccess) return;
    fetchRutas();
  }, [status, loadingPerms, canAccess, showInactive]);

  if (status === 'loading' || loadingPerms) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Cargando...
      </div>
    );
  }

  if (!canAccess) return null;

  const handleCreateRuta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRutaName.trim()) return;
    if (!can('RUTAS_CREATE')) return;

    try {
      setCreating(true);
      const res = await fetch('/api/rutas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: newRutaName }),
      });

      if (!res.ok) throw new Error('Error al crear ruta');

      setShowModal(false);
      setNewRutaName('');
      fetchRutas();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear ruta');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActivo = async (id: number, activo: boolean) => {
    try {
      if (!can('RUTAS_UPDATE')) return;
      const res = await fetch(`/api/rutas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !activo }),
      });

      if (!res.ok) throw new Error('Error al actualizar ruta');
      fetchRutas();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar ruta');
    }
  };

  return (
    <div className="app-bg">
      <Navbar />
      <main className="app-main">
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            padding: '2rem'
          }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>Gestión de Rutas</h1>
              <p style={{ color: '#666', fontSize: '0.95rem' }}>Administra las rutas de cobro</p>
            </div>
            {can('RUTAS_CREATE') && (
              <button
                onClick={() => setShowModal(true)}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                + Nueva Ruta
              </button>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#555', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              <span>Mostrar rutas inactivas</span>
            </label>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', border: '6px solid #e5e7eb', borderTop: '6px solid #0070f3', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
              <p style={{ marginTop: '1rem', color: '#666' }}>Cargando rutas...</p>
            </div>
          ) : rutas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: '#999', fontSize: '1.1rem' }}>No hay rutas registradas</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {rutas.map((ruta) => (
                <div
                  key={ruta.id}
                  style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    backgroundColor: ruta.activo ? 'white' : '#f9f9f9',
                    opacity: ruta.activo ? 1 : 0.7,
                    transition: 'box-shadow 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#333', marginBottom: '0.5rem' }}>
                      {ruta.nombre}
                    </h3>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: ruta.activo ? '#d4edda' : '#e2e3e5',
                        color: ruta.activo ? '#155724' : '#383d41'
                      }}
                    >
                      {ruta.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      <span style={{ color: '#666' }}>Clientes:</span>
                      <span style={{ fontWeight: '600', color: '#333' }}>{ruta._count.clientes}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      <span style={{ color: '#666' }}>Préstamos:</span>
                      <span style={{ fontWeight: '600', color: '#333' }}>{ruta._count.prestamos}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ color: '#666' }}>Cobradores:</span>
                      <span style={{ fontWeight: '600', color: '#333' }}>{ruta._count.usuarios}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {can('RUTAS_READ') && (
                      <Link
                        href={`/rutas/${ruta.id}`}
                        style={{
                          flex: 1,
                          backgroundColor: '#0070f3',
                          color: 'white',
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          textAlign: 'center',
                          textDecoration: 'none',
                          fontSize: '0.9rem',
                          fontWeight: '500'
                        }}
                      >
                        Ver Detalles
                      </Link>
                    )}
                    {can('RUTAS_UPDATE') && (
                      <button
                        onClick={() => handleToggleActivo(ruta.id, ruta.activo)}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: ruta.activo ? '#e0e0e0' : '#28a745',
                          color: ruta.activo ? '#555' : 'white'
                        }}
                      >
                        {ruta.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </main>

      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333', marginBottom: '1.5rem' }}>Nueva Ruta</h2>
            <form onSubmit={handleCreateRuta}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: '#555', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Nombre de la Ruta
                </label>
                <input
                  type="text"
                  value={newRutaName}
                  onChange={(e) => setNewRutaName(e.target.value)}
                  placeholder="Ej: Ruta Norte, Ruta Centro..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setNewRutaName('');
                  }}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: '#e0e0e0',
                    color: '#555',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: creating ? 'not-allowed' : 'pointer'
                  }}
                  disabled={creating}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: creating ? '#999' : '#0070f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: creating ? 'not-allowed' : 'pointer'
                  }}
                  disabled={creating}
                >
                  {creating ? 'Creando...' : 'Crear Ruta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

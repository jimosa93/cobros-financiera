'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { usePermissions } from '@/contexts/PermissionsContext';

interface Usuario {
  id: number;
  nombreCompleto: string;
  email: string;
  rol: string;
}

interface Ruta {
  id: number;
  nombre: string;
  activo: boolean;
  fechaCreacion: string;
  usuarios: Usuario[];
  _count: {
    clienteRutas: number;
    prestamos: number;
  };
}

export default function RutaDetailPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { can, loading: loadingPerms } = usePermissions();
  const params = useParams();
  const id = params?.id as string;
  
  const [ruta, setRuta] = useState<Ruta | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (status === 'loading' || loadingPerms) return;
    if (!session) {
      router.replace('/login');
      return;
    }
    if (!can('RUTAS_READ', 'RUTAS_UPDATE', 'RUTAS_DELETE')) {
      router.replace('/');
    }
  }, [status, loadingPerms, session, can, router]);

  const fetchRuta = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/rutas/${id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Error al cargar ruta');
      const data = await res.json();
      setRuta(data.ruta);
      setNewName(data.ruta.nombre);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar ruta');
      router.push('/rutas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && session && can('RUTAS_READ', 'RUTAS_UPDATE', 'RUTAS_DELETE')) {
      fetchRuta();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, session, can]);

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

  if (!session || !can('RUTAS_READ', 'RUTAS_UPDATE', 'RUTAS_DELETE')) return null;

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    if (!can('RUTAS_UPDATE')) return;

    try {
      const res = await fetch(`/api/rutas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: newName }),
      });

      if (!res.ok) throw new Error('Error al actualizar ruta');
      setEditing(false);
      fetchRuta();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar ruta');
    }
  };

  const handleToggleActivo = async () => {
    if (!ruta) return;
    if (!can('RUTAS_UPDATE')) return;

    try {
      const res = await fetch(`/api/rutas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !ruta.activo }),
      });

      if (!res.ok) throw new Error('Error al actualizar ruta');
      fetchRuta();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar ruta');
    }
  };

  const handleDelete = async () => {
    if (!ruta) return;
    if (!can('RUTAS_DELETE')) return;

    if (ruta._count.clienteRutas > 0 || ruta._count.prestamos > 0 || ruta.usuarios.length > 0) {
      alert('No se puede eliminar una ruta con clientes, préstamos o usuarios asociados. Desactívala en su lugar.');
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar la ruta "${ruta.nombre}"?`)) return;

    try {
      const res = await fetch(`/api/rutas/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al eliminar ruta');
      }

      alert('Ruta eliminada exitosamente');
      router.push('/rutas');
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'Error al eliminar ruta');
    }
  };

  if (loading) {
    return (
      <div className="app-bg">
        <Navbar />
        <main className="app-main">
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', border: '6px solid #e5e7eb', borderTop: '6px solid #0070f3', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
            <p style={{ marginTop: '1rem', color: '#666' }}>Cargando ruta...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!ruta) {
    return (
      <div className="app-bg">
        <Navbar />
        <main className="app-main">
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '1rem' }}>Ruta no encontrada</p>
            <Link href="/rutas" style={{ color: '#0070f3', textDecoration: 'underline' }}>
              Volver a rutas
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-bg">
      <Navbar />
      <main className="app-main">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Link
            href="/rutas"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              color: '#0070f3',
              textDecoration: 'none',
              marginBottom: '1.5rem',
              fontSize: '0.95rem'
            }}
          >
            ← Volver a rutas
          </Link>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            padding: '2rem'
          }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              {editing ? (
                <form onSubmit={handleUpdateName} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                    required
                  />
                  <button
                    type="submit"
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#0070f3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setNewName(ruta.nombre);
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#e0e0e0',
                      color: '#555',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    Cancelar
                  </button>
                </form>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h1 className="page-title" style={{ marginBottom: 0 }}>{ruta.nombre}</h1>
                    {can('RUTAS_UPDATE') && (
                      <button
                        onClick={() => setEditing(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '1.25rem'
                        }}
                      >
                        ✏️
                      </button>
                    )}
                  </div>
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: '0.5rem',
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
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {can('RUTAS_UPDATE') && (
                <button
                  onClick={handleToggleActivo}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500',
                    backgroundColor: ruta.activo ? '#e0e0e0' : '#28a745',
                    color: ruta.activo ? '#555' : 'white'
                  }}
                >
                  {ruta.activo ? 'Desactivar' : 'Activar'}
                </button>
              )}
              {can('RUTAS_DELETE') && (
                <button
                  onClick={handleDelete}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ backgroundColor: '#e3f2fd', borderRadius: '8px', padding: '1.5rem' }}>
              <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Clientes</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1976d2' }}>{ruta._count.clienteRutas}</p>
            </div>
            <div style={{ backgroundColor: '#f3e5f5', borderRadius: '8px', padding: '1.5rem' }}>
              <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Préstamos</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#7b1fa2' }}>{ruta._count.prestamos}</p>
            </div>
            <div style={{ backgroundColor: '#e8f5e9', borderRadius: '8px', padding: '1.5rem' }}>
              <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Cobradores</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#388e3c' }}>{ruta.usuarios.length}</p>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#333', marginBottom: '1rem' }}>Cobradores Asignados</h2>
            {ruta.usuarios.length === 0 ? (
              <p style={{ color: '#999' }}>No hay cobradores asignados a esta ruta</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {ruta.usuarios.map((usuario) => (
                  <div
                    key={usuario.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#f9f9f9',
                      borderRadius: '8px',
                      padding: '1rem'
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: '600', color: '#333' }}>{usuario.nombreCompleto}</p>
                      <p style={{ fontSize: '0.85rem', color: '#666' }}>{usuario.email}</p>
                    </div>
                    {session?.user?.rol === 'ADMIN' && (
                      <Link
                        href={`/users/${usuario.id}/editar`}
                        style={{ color: '#0070f3', fontSize: '0.9rem', textDecoration: 'none' }}
                      >
                        Editar →
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid #e0e0e0', marginTop: '1.5rem', paddingTop: '1.5rem' }}>
            <p style={{ fontSize: '0.85rem', color: '#999' }}>
              Fecha de creación: {new Date(ruta.fechaCreacion).toLocaleDateString('es-ES')}
            </p>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}

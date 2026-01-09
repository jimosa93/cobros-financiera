'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Navbar } from './Navbar';
import { searchBlock, inputStyle, primaryButton } from '@/styles/ui';
import { IconButton, Pagination } from '@/components/TableControls';
import SearchBar from './SearchBar';

interface Cliente {
  id: number;
  nombreCompleto: string;
  celular: string;
  direccionNegocio: string | null;
  direccionVivienda: string | null;
  fechaCreacion: string;
  prestamos: { id: number }[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ClientesList() {
  const { data: session } = useSession();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchClientes = async (page = 1, searchTerm = '') => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/clientes?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar clientes');
      }

      setClientes(data.clientes);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes(1, search);
  }, [search]);

  const handleDelete = (id: number) => {
    setClienteToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!clienteToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/clientes/${clienteToDelete}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar cliente');
      }

      setShowDeleteModal(false);
      setClienteToDelete(null);
      fetchClientes(pagination.page, search);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar cliente');
    } finally {
      setDeleting(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    fetchClientes(newPage, search);
  };

  if (!session) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Navbar />
      <main style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <h1 style={{ color: '#333', margin: 0 }}>Clientes</h1>
        </div>

        <SearchBar
          value={search}
          onChange={(v) => setSearch(v)}
          placeholder="Buscar por nombre, celular o dirección..."
          addHref="/clientes/nuevo"
          addLabel="+ Nuevo Cliente"
          showAdd={session.user.rol === 'ADMIN'}
        />

        {error && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#fee',
            color: '#c33',
            borderRadius: '6px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
            Cargando clientes...
          </div>
        ) : clientes.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            padding: '3rem',
            borderRadius: '8px',
            textAlign: 'center',
            color: '#666'
          }}>
            {search ? 'No se encontraron clientes con ese criterio de búsqueda' : 'No hay clientes registrados'}
          </div>
        ) : (
          <>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#333' }}>ID</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#333' }}>Nombre Completo</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#333' }}>Celular</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#333' }}>Dirección Negocio</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#333' }}>Préstamos</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#333' }}>Fecha Creación</th>
                    {session.user.rol === 'ADMIN' && (
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#333' }}>Acciones</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((cliente) => (
                    <tr
                      key={cliente.id}
                      style={{
                        borderBottom: '1px solid #e0e0e0',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                      }}
                    >
                      <td style={{ padding: '1rem', color: '#666' }}>{cliente.id}</td>
                      <td style={{ padding: '1rem', fontWeight: '500', color: '#333' }}>
                        {cliente.nombreCompleto}
                      </td>
                      <td style={{ padding: '1rem', color: '#666' }}>{cliente.celular}</td>
                      <td style={{ padding: '1rem', color: '#666' }}>
                        {cliente.direccionNegocio || '-'}
                      </td>
                      <td style={{ padding: '1rem', color: '#666' }}>
                        {cliente.prestamos.length}
                      </td>
                      <td style={{ padding: '1rem', color: '#666' }}>
                        {new Date(cliente.fechaCreacion).toLocaleDateString('es-ES')}
                      </td>
                      {session.user.rol === 'ADMIN' && (
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <IconButton type="edit" onClick={() => window.location.href = `/clientes/${cliente.id}/editar`} />
                            <IconButton type="delete" onClick={() => handleDelete(cliente.id)} />
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination page={pagination.page} totalPages={Math.max(1, pagination.totalPages)} onPrev={() => handlePageChange(pagination.page - 1)} onNext={() => handlePageChange(pagination.page + 1)} />
          </>
        )}

        {showDeleteModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              maxWidth: '400px',
              width: '90%'
            }}>
              <h2 style={{ marginBottom: '1rem', color: '#333' }}>Confirmar eliminación</h2>
              <p style={{ marginBottom: '1.5rem', color: '#666' }}>
                ¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setClienteToDelete(null);
                  }}
                  disabled={deleting}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    color: '#333',
                    cursor: deleting ? 'not-allowed' : 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: deleting ? '#999' : '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: deleting ? 'not-allowed' : 'pointer',
                    fontWeight: '500'
                  }}
                >
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

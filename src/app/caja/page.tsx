'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import SearchBar from '@/components/SearchBar';
import { cardStyle } from '@/styles/ui';
import { Pagination, IconButton } from '@/components/TableControls';
import { useToast } from '@/components/Toast';
import Spinner from '@/components/Spinner';

interface CajaItem {
  id: number;
  fecha: string;
  tipo: string;
  monto: string;
  nota?: string | null;
}

export default function CajaPage() {
  const { data: session } = useSession();
  const isAdmin = !!session && session.user?.rol === 'ADMIN';
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState<CajaItem[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = async (p = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/caja?page=${p}&limit=50`);
      const d = await res.json();
      setItems(d.caja || []);
      setTotalPages(Math.max(1, d.pagination?.totalPages || 1));
    } catch (error) {
      console.error('Error fetching caja data:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page);
  }, [page]);

  useEffect(() => {
    if (session === undefined) return;
    if (!isAdmin) router.replace('/');
  }, [session, isAdmin, router]);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Navbar />
      <main style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ marginBottom: '1rem', color: '#333' }}>Caja</h1>

        <div style={{ marginBottom: '1rem', ...cardStyle as React.CSSProperties }}>
          <SearchBar
            value={query}
            onChange={(v) => { setQuery(v); setPage(1); }}
            placeholder="Buscar movimientos..."
            addHref="/caja/nuevo"
            addLabel="+ Nuevo movimiento de Caja"
            showAdd={isAdmin}
          />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, color: '#222' }}>Fecha</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, color: '#222' }}>Tipo</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, color: '#222' }}>Monto</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, color: '#222' }}>Nota</th>
                  {isAdmin && <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, color: '#222' }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={isAdmin ? 5 : 4} style={{ padding: 20, textAlign: 'center' }}>
                    <Spinner size={40} />
                  </td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={isAdmin ? 5 : 4} style={{ padding: 20, textAlign: 'center' }}>No hay movimientos</td></tr>
                ) : items.map(it => (
                  <tr key={it.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: 12, color: '#222' }}>{new Date(it.fecha).toLocaleDateString('es-ES')}</td>
                    <td style={{ padding: 12, color: '#222' }}>{it.tipo}</td>
                    <td style={{ padding: 12, color: '#222' }}>{Number(it.monto).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</td>
                    <td style={{ padding: 12, color: '#222' }}>{it.nota || '-'}</td>
                    {isAdmin && (
                      <td style={{ padding: 12 }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <IconButton type="edit" title="Editar" onClick={() => router.push(`/caja/${it.id}/editar`)} />
                          <IconButton type="delete" title="Eliminar" onClick={async () => {
                            if (!confirm('¿Eliminar movimiento de caja?')) return;
                            try {
                              const res = await fetch('/api/caja/delete', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: it.id }),
                              });
                              if (!res.ok) throw new Error('Error eliminando');
                              // refetch
                              fetchData(page);
                              toast.addToast({ message: 'Movimiento eliminado', type: 'success' });
                            } catch (error) {
                              console.error('Error deleting caja:', error);
                              toast.addToast({ message: 'Error eliminando movimiento', type: 'error' });
                            }
                          }} />
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 12 }}>
            <Pagination page={page} totalPages={totalPages} onPrev={() => setPage(p => Math.max(1, p - 1))} onNext={() => setPage(p => p + 1)} />
          </div>
        </div>
      </main>
    </div>
  );
}

